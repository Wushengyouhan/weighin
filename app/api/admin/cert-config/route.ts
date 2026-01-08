import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * 获取奖状配置
 * GET /api/admin/cert-config?weekNumber=202550
 * 如果不传 weekNumber，返回默认配置（week_number 为 null）
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
    const weekNumberParam = searchParams.get('weekNumber')

    let weekNumber: number | null = null
    if (weekNumberParam) {
      weekNumber = parseInt(weekNumberParam)
      if (isNaN(weekNumber)) {
        return NextResponse.json(
          { code: 400, msg: '无效的周编号' },
          { status: 400 }
        )
      }
    }

    // 查询配置（week_number 为 null 表示默认配置）
    const config = await db.cert_configs.findFirst({
      where: { week_number: weekNumber },
    })

    if (!config) {
      return NextResponse.json({
        code: 200,
        msg: 'success',
        data: {
          weekNumber: weekNumber,
          isDefault: weekNumber === null,
          imgGold: '',
          imgSilver: '',
          imgBronze: '',
          imgParticipate: '',
        },
      })
    }

    return NextResponse.json({
      code: 200,
      msg: 'success',
      data: {
        id: config.id.toString(),
        weekNumber: config.week_number,
        isDefault: config.week_number === null,
        imgGold: config.img_gold,
        imgSilver: config.img_silver,
        imgBronze: config.img_bronze,
        imgParticipate: config.img_participate,
      },
    })
  } catch (error: any) {
    console.error('获取奖状配置失败:', error)
    return NextResponse.json(
      { code: 500, msg: error.message || '获取配置失败' },
      { status: 500 }
    )
  }
}

/**
 * 保存奖状配置
 * POST /api/admin/cert-config
 * Body: { weekNumber: 202550 | null, imgGold, imgSilver, imgBronze, imgParticipate }
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

    const body = await request.json()
    const { weekNumber, imgGold, imgSilver, imgBronze, imgParticipate } = body

    // 验证必填字段
    if (!imgGold || !imgSilver || !imgBronze || !imgParticipate) {
      return NextResponse.json(
        { code: 400, msg: '请填写所有底图URL' },
        { status: 400 }
      )
    }

    // 验证 URL 格式（简单验证）
    const urlPattern = /^https?:\/\/.+/
    const urls = [imgGold, imgSilver, imgBronze, imgParticipate]
    for (const url of urls) {
      if (!urlPattern.test(url)) {
        return NextResponse.json(
          { code: 400, msg: '底图URL格式不正确，必须以 http:// 或 https:// 开头' },
          { status: 400 }
        )
      }
    }

    // weekNumber 为 null 或 undefined 表示默认配置
    const weekNumberValue = weekNumber === null || weekNumber === undefined ? null : parseInt(weekNumber.toString())

    if (weekNumberValue !== null && isNaN(weekNumberValue)) {
      return NextResponse.json(
        { code: 400, msg: '无效的周编号' },
        { status: 400 }
      )
    }

    // 检查是否已存在配置
    const existing = await db.cert_configs.findFirst({
      where: { week_number: weekNumberValue },
    })

    let config
    if (existing) {
      // 更新现有配置
      config = await db.cert_configs.update({
        where: { id: existing.id },
        data: {
          img_gold: imgGold,
          img_silver: imgSilver,
          img_bronze: imgBronze,
          img_participate: imgParticipate,
          updated_at: new Date(),
        },
      })
    } else {
      // 创建新配置
      config = await db.cert_configs.create({
        data: {
          week_number: weekNumberValue,
          img_gold: imgGold,
          img_silver: imgSilver,
          img_bronze: imgBronze,
          img_participate: imgParticipate,
        },
      })
    }

    return NextResponse.json({
      code: 200,
      msg: '保存成功',
      data: {
        id: config.id.toString(),
        weekNumber: config.week_number,
        isDefault: config.week_number === null,
        imgGold: config.img_gold,
        imgSilver: config.img_silver,
        imgBronze: config.img_bronze,
        imgParticipate: config.img_participate,
      },
    })
  } catch (error: any) {
    console.error('保存奖状配置失败:', error)
    
    // 处理唯一约束错误
    if (error.code === 'P2002') {
      return NextResponse.json(
        { code: 400, msg: '该周已存在配置，请先删除或更新' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { code: 500, msg: error.message || '保存配置失败' },
      { status: 500 }
    )
  }
}

/**
 * 删除奖状配置
 * DELETE /api/admin/cert-config?weekNumber=202550
 */
export async function DELETE(request: NextRequest) {
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
    const weekNumberParam = searchParams.get('weekNumber')

    if (!weekNumberParam) {
      return NextResponse.json(
        { code: 400, msg: '请提供周编号' },
        { status: 400 }
      )
    }

    const weekNumber = weekNumberParam === 'null' ? null : parseInt(weekNumberParam)
    
    if (weekNumber !== null && isNaN(weekNumber)) {
      return NextResponse.json(
        { code: 400, msg: '无效的周编号' },
        { status: 400 }
      )
    }

    // 不允许删除默认配置（week_number 为 null）
    if (weekNumber === null) {
      return NextResponse.json(
        { code: 400, msg: '不能删除默认配置' },
        { status: 400 }
      )
    }

    await db.cert_configs.deleteMany({
      where: { week_number: weekNumber },
    })

    return NextResponse.json({
      code: 200,
      msg: '删除成功',
    })
  } catch (error: any) {
    console.error('删除奖状配置失败:', error)
    return NextResponse.json(
      { code: 500, msg: error.message || '删除配置失败' },
      { status: 500 }
    )
  }
}

