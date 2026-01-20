import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
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

/**
 * 上传用户角色图片
 * POST /api/admin/user-character
 * Body: FormData { userId: string, file: File }
 */
export async function POST(request: NextRequest) {
  try {
    // 可选：验证管理员权限
    const authHeader = request.headers.get('authorization')
    const adminSecret = process.env.ADMIN_SECRET

    if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { code: 401, msg: '无权限' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const userIdStr = formData.get('userId') as string
    const file = formData.get('file') as File

    if (!userIdStr) {
      return NextResponse.json(
        { code: 400, msg: '请提供用户ID' },
        { status: 400 }
      )
    }

    const userId = BigInt(userIdStr)

    if (!file) {
      return NextResponse.json(
        { code: 400, msg: '请选择文件' },
        { status: 400 }
      )
    }

    // 验证文件类型（只允许图片）
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { code: 400, msg: '只能上传图片文件' },
        { status: 400 }
      )
    }

    // 验证文件大小（限制 5MB）
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { code: 400, msg: '图片大小不能超过 5MB' },
        { status: 400 }
      )
    }

    // 检查用户是否存在
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { code: 404, msg: '用户不存在' },
        { status: 404 }
      )
    }

    // 生成文件名：characters/{userId}-{timestamp}.{ext}
    const timestamp = Date.now()
    const ext = file.name.split('.').pop() || 'png'
    const fileName = `characters/${userId}-${timestamp}.${ext}`

    // 转换为 Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 上传到 OSS
    const client = getOSSClient()
    
    try {
      const result = await client.put(fileName, buffer, {
        headers: {
          'Content-Type': file.type,
        },
      })

      // 更新用户表中的 character_image 字段
      await db.user.update({
        where: { id: userId },
        data: {
          characterImage: result.url,
        },
      })

      // 返回图片 URL
      return NextResponse.json({
        code: 200,
        msg: '上传成功',
        data: {
          url: result.url,
          userId: userId.toString(),
        },
      })
    } catch (ossError: any) {
      console.error('OSS 上传失败:', ossError.message)
      
      if (ossError.code === 'RequestError' || ossError.status === -1) {
        return NextResponse.json(
          { code: 500, msg: 'OSS 连接失败，请检查配置信息' },
          { status: 500 }
        )
      }
      
      throw ossError
    }
  } catch (error: any) {
    console.error('上传用户角色图片失败:', error)
    return NextResponse.json(
      { code: 500, msg: error.message || '上传失败，请稍后再试' },
      { status: 500 }
    )
  }
}

/**
 * 获取用户角色图片
 * GET /api/admin/user-character?userId=123
 */
export async function GET(request: NextRequest) {
  try {
    // 可选：验证管理员权限
    const authHeader = request.headers.get('authorization')
    const adminSecret = process.env.ADMIN_SECRET

    if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { code: 401, msg: '无权限' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userIdStr = searchParams.get('userId')

    if (!userIdStr) {
      return NextResponse.json(
        { code: 400, msg: '请提供用户ID' },
        { status: 400 }
      )
    }

    const userId = BigInt(userIdStr)

    // 查询用户
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        characterImage: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { code: 404, msg: '用户不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      code: 200,
      msg: 'success',
      data: {
        userId: user.id.toString(),
        nickname: user.nickname,
        characterImage: user.characterImage,
      },
    })
  } catch (error: any) {
    console.error('获取用户角色图片失败:', error)
    return NextResponse.json(
      { code: 500, msg: error.message || '获取失败' },
      { status: 500 }
    )
  }
}
