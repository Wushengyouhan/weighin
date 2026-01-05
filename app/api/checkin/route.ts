import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'
import { getWeekNumber, isCheckInOpen } from '@/lib/week'
import { getCurrentDate } from '@/lib/time-mock-server'
import OSS from 'ali-oss'

// 初始化 OSS 客户端
function getOSSClient() {
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET
  const bucket = process.env.OSS_BUCKET
  const region = process.env.OSS_REGION
  const endpoint = process.env.OSS_ENDPOINT

  if (!accessKeyId || !accessKeySecret || !bucket || !region || !endpoint) {
    throw new Error('OSS 配置不完整，请检查 .env 文件')
  }

  const config: any = {
    accessKeyId,
    accessKeySecret,
    bucket,
    region,
    endpoint,
    timeout: 60000,
  }

  return new OSS(config)
}

// 提交打卡
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { code: 401, msg: '未登录' },
        { status: 401 }
      )
    }

    // 检查打卡时间（每周一 00:00 - 20:00）
    const mockDate = getCurrentDate(request.headers)
    if (!isCheckInOpen(mockDate)) {
      return NextResponse.json(
        { code: 400, msg: '打卡时间已结束，请等待下次打卡时间' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const weight = formData.get('weight')
    const file = formData.get('photo') as File

    // 验证体重
    const weightNum = weight ? parseFloat(weight.toString()) : null
    if (!weightNum || weightNum < 30 || weightNum > 200) {
      return NextResponse.json(
        { code: 400, msg: '请输入有效的体重（30-200 kg）' },
        { status: 400 }
      )
    }

    // 验证照片
    if (!file) {
      return NextResponse.json(
        { code: 400, msg: '请上传照片' },
        { status: 400 }
      )
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { code: 400, msg: '只能上传图片文件' },
        { status: 400 }
      )
    }

    // 验证文件大小（限制 10MB）
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { code: 400, msg: '图片大小不能超过 10MB' },
        { status: 400 }
      )
    }

    // 计算周数
    const weekNumber = getWeekNumber(mockDate)

    // 上传照片到 OSS
    const timestamp = Date.now()
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `checkins/${userId}-${weekNumber}-${timestamp}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const client = getOSSClient()
    const ossResult = await client.put(fileName, buffer, {
      headers: {
        'Content-Type': file.type,
      },
    })

    const photoUrl = ossResult.url

    // 检查是否已存在打卡记录
    const existingCheckin = await db.checkins.findFirst({
      where: {
        user_id: userId,
        week_number: weekNumber,
      },
    })

    let checkin
    if (existingCheckin) {
      // 更新现有记录
      checkin = await db.checkins.update({
        where: { id: existingCheckin.id },
        data: {
          weight: weightNum,
          photo_url: photoUrl,
          updated_at: new Date(),
        },
      })
    } else {
      // 创建新记录
      checkin = await db.checkins.create({
        data: {
          user_id: userId,
          weight: weightNum,
          photo_url: photoUrl,
          week_number: weekNumber,
        },
      })
    }

    return NextResponse.json({
      code: 200,
      msg: '打卡成功',
      data: {
        id: checkin.id.toString(),
        weight: Number(checkin.weight),
        weekNumber: checkin.week_number,
        photoUrl: checkin.photo_url,
      },
    })
  } catch (error: any) {
    console.error('打卡失败:', error)
    
    // 处理唯一约束错误（重复打卡）
    if (error.code === 'P2002') {
      return NextResponse.json(
        { code: 400, msg: '本周已打卡，可在 20:00 前修改' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { code: 500, msg: error.message || '打卡失败，请稍后再试' },
      { status: 500 }
    )
  }
}

