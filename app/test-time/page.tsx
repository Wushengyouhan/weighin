'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { setMockDate, clearMockDate, createTestDate, getCurrentDate } from '@/lib/time-mock'
import {
  getWeekNumber,
  getMonday,
  getCheckInDeadline,
  getNextCheckInStart,
  isCheckInOpen,
  getTimeUntilDeadline,
  getDaysUntilNextCheckIn,
} from '@/lib/week'

export default function TestTimePage() {
  const [mockYear, setMockYear] = useState(2026)
  const [mockMonth, setMockMonth] = useState(1)
  const [mockDay, setMockDay] = useState(5)
  const [mockHour, setMockHour] = useState(10)
  const [mockMinute, setMockMinute] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  // 每秒更新一次显示，以便看到实时变化
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshKey((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const applyMockTime = () => {
    const testDate = createTestDate(mockYear, mockMonth, mockDay, mockHour, mockMinute)
    setMockDate(testDate)
    setRefreshKey((prev) => prev + 1) // 触发重新渲染
  }

  const resetToRealTime = () => {
    clearMockDate()
    setRefreshKey((prev) => prev + 1) // 触发重新渲染
  }

  const currentDate = getCurrentDate()
  const weekNumber = getWeekNumber()
  const monday = getMonday()
  const deadline = getCheckInDeadline()
  const nextStart = getNextCheckInStart()
  const checkInOpen = isCheckInOpen()
  const timeUntilDeadline = getTimeUntilDeadline()
  const daysUntilNext = getDaysUntilNextCheckIn()

  const hours = Math.floor(timeUntilDeadline / (1000 * 60 * 60))
  const minutes = Math.floor((timeUntilDeadline % (1000 * 60 * 60)) / (1000 * 60))

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6">时间测试工具</h1>

          {/* 设置模拟时间 */}
          <div className="space-y-4 mb-6">
            <h2 className="text-lg font-semibold">设置模拟时间</h2>
            <div className="grid grid-cols-5 gap-4">
              <div>
                <Label>年份</Label>
                <Input
                  type="number"
                  value={mockYear}
                  onChange={(e) => setMockYear(parseInt(e.target.value) || 2026)}
                />
              </div>
              <div>
                <Label>月份</Label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={mockMonth}
                  onChange={(e) => setMockMonth(parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label>日期</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={mockDay}
                  onChange={(e) => setMockDay(parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label>小时</Label>
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={mockHour}
                  onChange={(e) => setMockHour(parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>分钟</Label>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={mockMinute}
                  onChange={(e) => setMockMinute(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={applyMockTime}>应用模拟时间</Button>
              <Button onClick={resetToRealTime} variant="outline">
                恢复真实时间
              </Button>
            </div>
          </div>

          {/* 当前状态显示 */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">当前状态</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 p-4 rounded">
                <div className="text-sm text-gray-600">当前时间</div>
                <div className="text-lg font-semibold">
                  {currentDate.toLocaleString('zh-CN')}
                </div>
              </div>
              <div className="bg-gray-100 p-4 rounded">
                <div className="text-sm text-gray-600">周数</div>
                <div className="text-lg font-semibold">{weekNumber}</div>
              </div>
              <div className="bg-gray-100 p-4 rounded">
                <div className="text-sm text-gray-600">本周一</div>
                <div className="text-lg font-semibold">
                  {monday.toLocaleString('zh-CN')}
                </div>
              </div>
              <div className="bg-gray-100 p-4 rounded">
                <div className="text-sm text-gray-600">打卡截止时间</div>
                <div className="text-lg font-semibold">
                  {deadline.toLocaleString('zh-CN')}
                </div>
              </div>
              <div className="bg-gray-100 p-4 rounded">
                <div className="text-sm text-gray-600">下次打卡开始</div>
                <div className="text-lg font-semibold">
                  {nextStart.toLocaleString('zh-CN')}
                </div>
              </div>
              <div className="bg-gray-100 p-4 rounded">
                <div className="text-sm text-gray-600">打卡状态</div>
                <div
                  className={`text-lg font-semibold ${
                    checkInOpen ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {checkInOpen ? '✅ 开放' : '❌ 关闭'}
                </div>
              </div>
              {checkInOpen && (
                <div className="bg-gray-100 p-4 rounded col-span-2">
                  <div className="text-sm text-gray-600">距离截止剩余时间</div>
                  <div className="text-lg font-semibold">
                    {hours} 小时 {minutes} 分钟
                  </div>
                </div>
              )}
              {!checkInOpen && (
                <div className="bg-gray-100 p-4 rounded col-span-2">
                  <div className="text-sm text-gray-600">距离下次打卡开始</div>
                  <div className="text-lg font-semibold">{daysUntilNext} 天</div>
                </div>
              )}
            </div>
          </div>

          {/* 快速测试按钮 */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3">快速测试场景</h2>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const monday = getMonday()
                  monday.setHours(10, 0, 0)
                  setMockDate(monday)
                  setRefreshKey((prev) => prev + 1)
                }}
              >
                周一 10:00（打卡中）
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const monday = getMonday()
                  monday.setHours(19, 30, 0)
                  setMockDate(monday)
                  setRefreshKey((prev) => prev + 1)
                }}
              >
                周一 19:30（即将截止）
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const monday = getMonday()
                  monday.setHours(20, 30, 0)
                  setMockDate(monday)
                  setRefreshKey((prev) => prev + 1)
                }}
              >
                周一 20:30（已关闭）
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const monday = getMonday()
                  const tuesday = new Date(monday)
                  tuesday.setDate(tuesday.getDate() + 1)
                  tuesday.setHours(10, 0, 0)
                  setMockDate(tuesday)
                  setRefreshKey((prev) => prev + 1)
                }}
              >
                周二 10:00（已关闭）
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const monday = getMonday()
                  const sunday = new Date(monday)
                  sunday.setDate(sunday.getDate() - 1)
                  sunday.setHours(10, 0, 0)
                  setMockDate(sunday)
                  setRefreshKey((prev) => prev + 1)
                }}
              >
                周日 10:00（已关闭）
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

