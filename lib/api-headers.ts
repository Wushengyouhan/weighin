/**
 * API 请求头工具函数
 * 统一处理认证和模拟时间请求头
 */

import { getMockDateHeader } from './time-mock'

/**
 * 创建 API 请求头
 * @param token 认证 token
 */
export function createApiHeaders(token: string | null): HeadersInit {
  const headers: HeadersInit = {}
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // 如果设置了模拟时间，添加到请求头
  const mockDateHeader = getMockDateHeader()
  if (mockDateHeader) {
    headers['x-mock-date'] = mockDateHeader
  }

  return headers
}

