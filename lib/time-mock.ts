/**
 * 时间模拟工具
 * 用于测试不同时间下的打卡状态显示
 */

let mockDate: Date | null = null

/**
 * 设置模拟时间（用于测试）
 * @param date 要模拟的日期时间
 */
export function setMockDate(date: Date | null) {
  mockDate = date
  // 同时保存到 localStorage，以便服务端也能读取
  if (typeof window !== 'undefined') {
    if (date) {
      localStorage.setItem('mock-date', date.toISOString())
    } else {
      localStorage.removeItem('mock-date')
    }
  }
}

/**
 * 获取当前时间（如果设置了模拟时间则返回模拟时间，否则返回真实时间）
 */
export function getCurrentDate(): Date {
  if (mockDate) {
    return mockDate
  }
  
  // 尝试从 localStorage 恢复（用于页面刷新后）
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('mock-date')
    if (saved) {
      mockDate = new Date(saved)
      return mockDate
    }
  }
  
  return new Date()
}

/**
 * 清除模拟时间，恢复使用真实时间
 */
export function clearMockDate() {
  mockDate = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem('mock-date')
  }
}

/**
 * 获取模拟时间的 ISO 字符串（用于 API 请求头）
 */
export function getMockDateHeader(): string | null {
  const date = getCurrentDate()
  // 如果是模拟时间，返回 ISO 字符串；否则返回 null
  if (mockDate || (typeof window !== 'undefined' && localStorage.getItem('mock-date'))) {
    return date.toISOString()
  }
  return null
}

/**
 * 创建测试日期
 * @param year 年份
 * @param month 月份 (1-12)
 * @param day 日期
 * @param hour 小时 (0-23)
 * @param minute 分钟 (0-59)
 */
export function createTestDate(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0
): Date {
  return new Date(year, month - 1, day, hour, minute, 0)
}

