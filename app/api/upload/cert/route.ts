import { NextRequest, NextResponse } from 'next/server'
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

// 上传奖状底图
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
    const file = formData.get('file') as File
    const type = formData.get('type') as string // gold, silver, bronze, participate

    if (!file) {
      return NextResponse.json(
        { code: 400, msg: '请选择文件' },
        { status: 400 }
      )
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { code: 400, msg: '只能上传图片文件' },
        { status: 400 }
      )
    }

    // 验证文件大小（限制 10MB）
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { code: 400, msg: '图片大小不能超过 10MB' },
        { status: 400 }
      )
    }

    // 生成文件名：certs/{type}-{timestamp}.{ext}
    const timestamp = Date.now()
    const ext = file.name.split('.').pop() || 'jpg'
    const typePrefix = type || 'cert'
    const fileName = `certs/${typePrefix}-${timestamp}.${ext}`

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

      // 返回图片 URL
      return NextResponse.json({
        code: 200,
        msg: '上传成功',
        data: {
          url: result.url,
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
    console.error('上传奖状底图失败:', error)
    return NextResponse.json(
      { code: 500, msg: error.message || '上传失败，请稍后再试' },
      { status: 500 }
    )
  }
}

