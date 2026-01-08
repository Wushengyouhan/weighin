/**
 * 周数计算工具函数
 */

import { getCurrentDate } from './time-mock'

/**
 * 获取指定日期所在年份的第几周
 * 格式：YYYYWW（如 202451 表示 2024 年第 51 周）
 * 跨年周算作新年第一周（如果该周包含1月1日，则算作新年第一周）
 */
export function getWeekNumber(date?: Date): number {
  if (!date) date = getCurrentDate()
  
  // 找到该日期所在周的周一
  const monday = getMonday(date)
  const mondayYear = monday.getFullYear()
  const mondayMonth = monday.getMonth()
  
  // 计算该周的最后一天（周日）
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const sundayYear = sunday.getFullYear()
  const sundayMonth = sunday.getMonth()
  const sundayDate = sunday.getDate()
  
  // 判断该周是否包含1月1日（跨年周）
  const isCrossYearWeek = mondayMonth === 11 && sundayMonth === 0 && sundayDate >= 1
  
  // 如果该周包含1月1日，算作新年第一周
  const year = isCrossYearWeek ? sundayYear : date.getFullYear()
  
  // 如果是跨年周，直接返回新年第一周
  if (isCrossYearWeek) {
    return year * 100 + 1
  }
  
  // 计算该年第一周的周一（包含1月1日的那一周的周一）
  const startOfYear = new Date(year, 0, 1)
  const firstDayOfWeek = startOfYear.getDay() // 0=周日, 1=周一, ..., 6=周六
  
  // 计算第一周的周一（包含1月1日的那一周的周一）
  let firstMonday: Date
  if (firstDayOfWeek === 0) {
    // 1月1日是周日，该周周一是12月29日（上一年）
    firstMonday = new Date(year - 1, 11, 29)
  } else if (firstDayOfWeek === 1) {
    // 1月1日是周一，该周周一是1月1日
    firstMonday = new Date(year, 0, 1)
  } else {
    // 1月1日是周二到周六，该周周一是上一年的12月
    firstMonday = new Date(year, 0, 1)
    firstMonday.setDate(1 - (firstDayOfWeek - 1))
  }
  
  // 计算该周是第几周
  const daysDiff = Math.floor((monday.getTime() - firstMonday.getTime()) / (24 * 60 * 60 * 1000))
  const week = Math.floor(daysDiff / 7) + 1
  
  return year * 100 + week
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

/**
 * 根据周编号（YYYYWW格式）计算该周周一的日期
 * 使用与 getWeekNumber 相同的逻辑反向计算
 * @param weekNumber 周编号（如 202602 表示 2026年第2周）
 * @returns 该周周一的日期（可能属于上一年，如跨年周）
 */
export function getWeekMonday(weekNumber: number): Date {
  const year = Math.floor(weekNumber / 100)
  const week = weekNumber % 100
  
  // 如果是第1周，可能是跨年周，需要找到包含1月1日的那一周的周一
  if (week === 1) {
    // 查找1月1日所在周的周一
    const jan1 = new Date(year, 0, 1)
    const jan1Day = jan1.getDay() // 0=周日, 1=周一, ..., 6=周六
    
    let firstMonday: Date
    if (jan1Day === 0) {
      // 1月1日是周日，该周周一是12月29日（上一年）
      firstMonday = new Date(year - 1, 11, 29)
    } else if (jan1Day === 1) {
      // 1月1日是周一，该周周一是1月1日
      firstMonday = new Date(year, 0, 1)
    } else {
      // 1月1日是周二到周六，该周周一是上一年的12月
      // 往前推 (jan1Day - 1) 天
      firstMonday = new Date(year, 0, 1)
      firstMonday.setDate(1 - (jan1Day - 1))
    }
    
    firstMonday.setHours(0, 0, 0, 0)
    return firstMonday
  }
  
  // 计算该年第一周的周一（包含1月1日的那一周的周一）
  const startOfYear = new Date(year, 0, 1)
  const firstDayOfWeek = startOfYear.getDay() // 0=周日, 1=周一, ..., 6=周六
  
  let firstMonday: Date
  if (firstDayOfWeek === 0) {
    // 1月1日是周日，该周周一是12月29日（上一年）
    firstMonday = new Date(year - 1, 11, 29)
  } else if (firstDayOfWeek === 1) {
    // 1月1日是周一，该周周一是1月1日
    firstMonday = new Date(year, 0, 1)
  } else {
    // 1月1日是周二到周六，该周周一是上一年的12月
    firstMonday = new Date(year, 0, 1)
    firstMonday.setDate(1 - (firstDayOfWeek - 1))
  }
  
  // 计算第week周的周一
  const weekMonday = new Date(firstMonday)
  weekMonday.setDate(firstMonday.getDate() + (week - 1) * 7)
  weekMonday.setHours(0, 0, 0, 0)
  
  return weekMonday
}

