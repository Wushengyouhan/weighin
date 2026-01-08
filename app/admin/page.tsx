'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loading } from '@/components/Loading'
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react'

interface SettleResult {
  weekNumber: number
  success: boolean
  message: string
  count?: number
  alreadySettled?: boolean
  error?: string
}

export default function AdminSettlePage() {
  const [week, setWeek] = useState('')
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [force, setForce] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SettleResult | null>(null)

  const handleSingleSettle = async () => {
    if (!week) {
      alert('请输入周数')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const params = new URLSearchParams()
      params.append('week', week)
      if (year) params.append('year', year)
      if (force) params.append('force', 'true')

      const response = await fetch(`/api/admin/settle?${params.toString()}`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.code === 200) {
        setResult({
          weekNumber: data.data.weekNumber,
          success: true,
          message: data.msg,
          count: data.data.count,
        })
      } else {
        setResult({
          weekNumber: parseInt(year) * 100 + parseInt(week),
          success: false,
          message: data.msg,
          alreadySettled: data.data?.alreadySettled,
          count: data.data?.count,
        })
      }
    } catch (error: any) {
      setResult({
        weekNumber: parseInt(year) * 100 + parseInt(week),
        success: false,
        message: error.message || '结算失败',
        error: error.toString(),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSettleCurrentWeek = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/settle', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.code === 200) {
        setResult({
          weekNumber: data.data.weekNumber,
          success: true,
          message: data.msg,
          count: data.data.count,
        })
      } else {
        setResult({
          weekNumber: data.data?.weekNumber || 0,
          success: false,
          message: data.msg,
          alreadySettled: data.data?.alreadySettled,
          count: data.data?.count,
        })
      }
    } catch (error: any) {
      setResult({
        weekNumber: 0,
        success: false,
        message: error.message || '结算失败',
        error: error.toString(),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">结算管理</h1>
          <p className="text-gray-600">手动触发排名结算</p>
        </div>

        {/* 单个周结算 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">单个周结算</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="year">年份</Label>
                <Input
                  id="year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2025"
                />
              </div>
              <div>
                <Label htmlFor="week">周数 (1-53)</Label>
                <Input
                  id="week"
                  type="number"
                  value={week}
                  onChange={(e) => setWeek(e.target.value)}
                  placeholder="50"
                  min="1"
                  max="53"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="force"
                checked={force}
                onChange={(e) => setForce(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="force" className="cursor-pointer">
                强制重新结算（删除旧数据）
              </Label>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSingleSettle}
                disabled={loading || !week}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    结算中...
                  </>
                ) : (
                  '结算指定周'
                )}
              </Button>
              <Button
                onClick={handleSettleCurrentWeek}
                disabled={loading}
                variant="outline"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    结算中...
                  </>
                ) : (
                  '结算当前周'
                )}
              </Button>
            </div>

            {/* 结算结果 */}
            {result && (
              <div
                className={`p-4 rounded-lg ${
                  result.success
                    ? 'bg-green-50 border border-green-200'
                    : result.alreadySettled
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : result.alreadySettled ? (
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      周 {result.weekNumber}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {result.message}
                    </div>
                    {result.count !== undefined && (
                      <div className="text-sm text-gray-500 mt-1">
                        参与排名用户数：{result.count}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* 使用说明 */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">使用说明</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>单个周结算：输入年份和周数，点击"结算指定周"</li>
            <li>当前周结算：直接点击"结算当前周"按钮</li>
            <li>
              强制重新结算：勾选后会删除该周的旧结算数据，重新计算排名（默认开启）
            </li>
            <li>只有上周和本周都有打卡的用户才能参与排名</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}

