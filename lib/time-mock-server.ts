/**
 * 服务端时间模拟工具
 * 从请求头中读取模拟时间
 */

/**
 * 从请求头中获取模拟时间
 * @param headers 请求头对象
 */
export function getMockDateFromHeaders(headers: Headers): Date | null {
  const mockDateHeader = headers.get('x-mock-date')
  if (mockDateHeader) {
    try {
      return new Date(mockDateHeader)
    } catch {
      return null
    }
  }
  return null
}

/**
 * 获取当前时间（如果请求头中有模拟时间则使用，否则使用真实时间）
 * @param headers 请求头对象
 */
export function getCurrentDate(headers?: Headers): Date {
  if (headers) {
    const mockDate = getMockDateFromHeaders(headers)
    if (mockDate) {
      return mockDate
    }
  }
  return new Date()
}

