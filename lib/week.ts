/**
 * 周数计算工具函数
 */

import { getCurrentDate } from './time-mock'

/**
 * 获取指定日期所在年份的第几周
 * 格式：YYYYWW（如 202451 表示 2024 年第 51 周）
 */
export function getWeekNumber(date?: Date): number {
  if (!date) date = getCurrentDate()
  const year = date.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7)
  return year * 100 + weekNumber
}

/**
 * 获取本周一的日期（00:00:00）
 */
export function getMonday(date?: Date): Date {
  if (!date) date = getCurrentDate()
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 如果周日，则减去6天，否则减去(day-1)天
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * 获取本周一的 20:00:00（打卡结束时间）
 */
export function getCheckInDeadline(date?: Date): Date {
  if (!date) date = getCurrentDate()
  const monday = getMonday(date)
  const deadline = new Date(monday)
  deadline.setHours(20, 0, 0, 0)
  return deadline
}

/**
 * 获取下周一 00:00:00（下次打卡开始时间）
 */
export function getNextCheckInStart(date?: Date): Date {
  if (!date) date = getCurrentDate()
  const monday = getMonday(date)
  const nextMonday = new Date(monday)
  nextMonday.setDate(nextMonday.getDate() + 7)
  return nextMonday
}

/**
 * 判断当前时间是否在打卡时间段内
 * 打卡时间：每周一 00:00 - 20:00
 */
export function isCheckInOpen(date?: Date): boolean {
  if (!date) date = getCurrentDate()
  const monday = getMonday(date)
  const deadline = getCheckInDeadline(date)
  return date >= monday && date < deadline
}

/**
 * 计算距离打卡截止的剩余时间（毫秒）
 */
export function getTimeUntilDeadline(date?: Date): number {
  if (!date) date = getCurrentDate()
  const deadline = getCheckInDeadline(date)
  return Math.max(0, deadline.getTime() - date.getTime())
}

/**
 * 计算距离下次打卡开始的天数
 */
export function getDaysUntilNextCheckIn(date?: Date): number {
  if (!date) date = getCurrentDate()
  const nextMonday = getNextCheckInStart(date)
  const today = new Date(date)
  today.setHours(0, 0, 0, 0)
  const diffTime = nextMonday.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

