/**
 * 初始化结算定时任务
 * 只在服务端执行，应用启动时自动启动定时任务
 */
import { startSettlementCron } from './settlement'

// 确保只在服务端执行
if (typeof window === 'undefined') {
  startSettlementCron()
}

