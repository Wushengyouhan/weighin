import sharp from 'sharp'

/**
 * 图片合成配置
 * 根据测试结果确定的参数
 */
const COMPOSITE_CONFIG = {
  characterX: 420,         // 用户形象在底图上的X坐标（像素）
  characterY: 670,        // 用户形象在底图上的Y坐标（像素）
  characterWidth: 300,    // 用户形象宽度（像素）
  characterHeight: 300,   // 用户形象高度（像素）
}

/**
 * 下载图片并转换为 Buffer
 * @param imageUrl 图片 URL（支持 HTTP/HTTPS）
 * @returns 图片 Buffer
 */
async function downloadImage(imageUrl: string): Promise<Buffer> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`下载图片失败: ${response.status} ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error: any) {
    throw new Error(`下载图片失败: ${error.message}`)
  }
}

/**
 * 合成用户形象图片和奖状底图
 * @param baseImageUrl 底图 URL（奖状底图）
 * @param characterImageUrl 用户形象图片 URL（透明背景 PNG）
 * @returns 合成后的图片 Buffer
 */
export async function compositeCertificateImage(
  baseImageUrl: string,
  characterImageUrl: string | null
): Promise<Buffer> {
  try {
    // 1. 下载底图
    const baseImageBuffer = await downloadImage(baseImageUrl)
    const baseImage = sharp(baseImageBuffer)

    // 2. 如果没有用户形象图片，直接返回底图（保持原格式）
    if (!characterImageUrl) {
      const metadata = await baseImage.metadata()
      const format = metadata.format || 'png'
      return await baseImage.toFormat(format as any).toBuffer()
    }

    // 3. 下载用户形象图片
    const characterImageBuffer = await downloadImage(characterImageUrl)
    
    // 4. 调整用户形象图片大小（和测试脚本保持一致）
    const resizedCharacter = await sharp(characterImageBuffer)
      .resize(COMPOSITE_CONFIG.characterWidth, COMPOSITE_CONFIG.characterHeight, {
        fit: 'contain', // 保持比例，和测试脚本一致
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // 透明背景
      })
      .toBuffer()

    // 5. 合成图片（保持底图原格式）
    const baseMetadata = await baseImage.metadata()
    const baseFormat = baseMetadata.format || 'png'
    
    // 调试日志：输出实际使用的坐标和底图尺寸
    console.log('[图片合成] 底图尺寸:', baseMetadata.width, 'x', baseMetadata.height)
    console.log('[图片合成] 使用坐标: X=', COMPOSITE_CONFIG.characterX, ', Y=', COMPOSITE_CONFIG.characterY)
    console.log('[图片合成] 角色尺寸:', COMPOSITE_CONFIG.characterWidth, 'x', COMPOSITE_CONFIG.characterHeight)
    
    const compositeBuffer = await baseImage
      .composite([
        {
          input: resizedCharacter,
          left: COMPOSITE_CONFIG.characterX,
          top: COMPOSITE_CONFIG.characterY,
        },
      ])
      .toFormat(baseFormat as any)
      .toBuffer()

    return compositeBuffer
  } catch (error: any) {
    // 如果合成失败，返回底图
    console.error('图片合成失败，使用底图:', error.message)
    try {
      const baseImageBuffer = await downloadImage(baseImageUrl)
      const baseImage = sharp(baseImageBuffer)
      const metadata = await baseImage.metadata()
      const format = metadata.format || 'png'
      return await baseImage.toFormat(format as any).toBuffer()
    } catch (fallbackError: any) {
      throw new Error(`图片合成失败且无法获取底图: ${fallbackError.message}`)
    }
  }
}
