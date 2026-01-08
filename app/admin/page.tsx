'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loading } from '@/components/Loading'
import { CheckCircle2, XCircle, AlertCircle, Loader2, Trophy, Settings, Upload, Image as ImageIcon } from 'lucide-react'

interface SettleResult {
  weekNumber: number
  success: boolean
  message: string
  count?: number
  alreadySettled?: boolean
  error?: string
}

interface CertConfig {
  id?: string
  weekNumber: number | null
  isDefault: boolean
  imgGold: string
  imgSilver: string
  imgBronze: string
  imgParticipate: string
}

export default function AdminSettlePage() {
  // 结算相关状态
  const [week, setWeek] = useState('')
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [force, setForce] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SettleResult | null>(null)

  // 配置相关状态
  const [configType, setConfigType] = useState<'default' | 'week'>('default')
  const [configWeek, setConfigWeek] = useState('')
  const [configYear, setConfigYear] = useState(new Date().getFullYear().toString())
  const [config, setConfig] = useState<CertConfig>({
    weekNumber: null,
    isDefault: true,
    imgGold: '',
    imgSilver: '',
    imgBronze: '',
    imgParticipate: '',
  })
  const [configLoading, setConfigLoading] = useState(false)
  const [configSaving, setConfigSaving] = useState(false)
  const [configResult, setConfigResult] = useState<{ success: boolean; message: string } | null>(null)
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({})

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

  // 加载配置
  const loadConfig = async () => {
    setConfigLoading(true)
    setConfigResult(null)

    try {
      let weekNumber: number | null = null
      if (configType === 'week' && configWeek && configYear) {
        weekNumber = parseInt(configYear) * 100 + parseInt(configWeek)
      }

      const params = new URLSearchParams()
      if (weekNumber !== null) {
        params.append('weekNumber', weekNumber.toString())
      }

      const response = await fetch(`/api/admin/cert-config?${params.toString()}`)
      const data = await response.json()

      if (data.code === 200) {
        setConfig({
          id: data.data.id,
          weekNumber: data.data.weekNumber,
          isDefault: data.data.isDefault,
          imgGold: data.data.imgGold || '',
          imgSilver: data.data.imgSilver || '',
          imgBronze: data.data.imgBronze || '',
          imgParticipate: data.data.imgParticipate || '',
        })
      } else {
        setConfigResult({
          success: false,
          message: data.msg || '加载配置失败',
        })
      }
    } catch (error: any) {
      setConfigResult({
        success: false,
        message: error.message || '加载配置失败',
      })
    } finally {
      setConfigLoading(false)
    }
  }

  // 保存配置
  const saveConfig = async () => {
    if (!config.imgGold || !config.imgSilver || !config.imgBronze || !config.imgParticipate) {
      alert('请填写所有底图URL')
      return
    }

    if (configType === 'week' && (!configWeek || !configYear)) {
      alert('请选择周数')
      return
    }

    setConfigSaving(true)
    setConfigResult(null)

    try {
      let weekNumber: number | null = null
      if (configType === 'week') {
        weekNumber = parseInt(configYear) * 100 + parseInt(configWeek)
      }

      const response = await fetch('/api/admin/cert-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekNumber,
          imgGold: config.imgGold,
          imgSilver: config.imgSilver,
          imgBronze: config.imgBronze,
          imgParticipate: config.imgParticipate,
        }),
      })

      const data = await response.json()

      if (data.code === 200) {
        setConfigResult({
          success: true,
          message: '保存成功',
        })
        setConfig({
          ...config,
          id: data.data.id,
          weekNumber: data.data.weekNumber,
          isDefault: data.data.isDefault,
        })
      } else {
        setConfigResult({
          success: false,
          message: data.msg || '保存失败',
        })
      }
    } catch (error: any) {
      setConfigResult({
        success: false,
        message: error.message || '保存失败',
      })
    } finally {
      setConfigSaving(false)
    }
  }

  // 上传图片到OSS
  const handleImageUpload = async (type: 'gold' | 'silver' | 'bronze' | 'participate', file: File) => {
    setUploading({ ...uploading, [type]: true })

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/upload/cert', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.code === 200) {
        // 自动填充URL
        const urlField = type === 'gold' ? 'imgGold' : type === 'silver' ? 'imgSilver' : type === 'bronze' ? 'imgBronze' : 'imgParticipate'
        setConfig({ ...config, [urlField]: data.data.url })
      } else {
        alert(data.msg || '上传失败')
      }
    } catch (error: any) {
      alert(error.message || '上传失败')
    } finally {
      setUploading({ ...uploading, [type]: false })
    }
  }

  // 移除自动加载，只在用户明确需要时加载

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">管理后台</h1>
          <p className="text-gray-600">结算管理和奖励配置</p>
        </div>

        {/* 标签页 */}
        <Tabs defaultValue="settle" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settle" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              结算管理
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              奖励配置
            </TabsTrigger>
          </TabsList>

          {/* 结算管理标签页 */}
          <TabsContent value="settle" className="space-y-6">

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
          </TabsContent>

          {/* 奖励配置标签页 */}
          <TabsContent value="config" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">奖状底图配置</h2>
              <div className="space-y-4">
                {/* 配置类型选择 */}
                <div className="space-y-2">
                  <Label>配置类型</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="configType"
                        value="default"
                        checked={configType === 'default'}
                        onChange={(e) => {
                          setConfigType('default')
                          setConfigWeek('')
                        }}
                        className="w-4 h-4"
                      />
                      <span>默认配置</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="configType"
                        value="week"
                        checked={configType === 'week'}
                        onChange={(e) => setConfigType('week')}
                        className="w-4 h-4"
                      />
                      <span>指定周配置</span>
                    </label>
                  </div>
                </div>

                {/* 周数选择（仅指定周时显示） */}
                {configType === 'week' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="configYear">年份</Label>
                      <Input
                        id="configYear"
                        type="number"
                        value={configYear}
                        onChange={(e) => setConfigYear(e.target.value)}
                        placeholder="2025"
                      />
                    </div>
                    <div>
                      <Label htmlFor="configWeek">周数 (1-53)</Label>
                      <Input
                        id="configWeek"
                        type="number"
                        value={configWeek}
                        onChange={(e) => setConfigWeek(e.target.value)}
                        placeholder="50"
                        min="1"
                        max="53"
                      />
                    </div>
                  </div>
                )}

                {/* 底图URL输入和上传 */}
                <div className="space-y-4">
                  {/* 冠军底图 */}
                  <div>
                    <Label htmlFor="imgGold">冠军底图 (第1名)</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="imgGold"
                        type="url"
                        value={config.imgGold}
                        onChange={(e) =>
                          setConfig({ ...config, imgGold: e.target.value })
                        }
                        placeholder="https://example.com/cert/gold.jpg"
                        className="flex-1"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        id="uploadGold"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload('gold', file)
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('uploadGold')?.click()}
                        disabled={uploading.gold}
                      >
                        {uploading.gold ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    {config.imgGold && (
                      <div className="mt-2">
                        <img
                          src={config.imgGold}
                          alt="冠军底图预览"
                          className="max-w-xs max-h-64 object-contain rounded border border-gray-200 bg-gray-50"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* 亚军底图 */}
                  <div>
                    <Label htmlFor="imgSilver">亚军底图 (第2名)</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="imgSilver"
                        type="url"
                        value={config.imgSilver}
                        onChange={(e) =>
                          setConfig({ ...config, imgSilver: e.target.value })
                        }
                        placeholder="https://example.com/cert/silver.jpg"
                        className="flex-1"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        id="uploadSilver"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload('silver', file)
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('uploadSilver')?.click()}
                        disabled={uploading.silver}
                      >
                        {uploading.silver ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    {config.imgSilver && (
                      <div className="mt-2">
                        <img
                          src={config.imgSilver}
                          alt="亚军底图预览"
                          className="max-w-xs max-h-64 object-contain rounded border border-gray-200 bg-gray-50"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* 季军底图 */}
                  <div>
                    <Label htmlFor="imgBronze">季军底图 (第3名)</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="imgBronze"
                        type="url"
                        value={config.imgBronze}
                        onChange={(e) =>
                          setConfig({ ...config, imgBronze: e.target.value })
                        }
                        placeholder="https://example.com/cert/bronze.jpg"
                        className="flex-1"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        id="uploadBronze"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload('bronze', file)
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('uploadBronze')?.click()}
                        disabled={uploading.bronze}
                      >
                        {uploading.bronze ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    {config.imgBronze && (
                      <div className="mt-2">
                        <img
                          src={config.imgBronze}
                          alt="季军底图预览"
                          className="max-w-xs max-h-64 object-contain rounded border border-gray-200 bg-gray-50"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* 参与奖底图 */}
                  <div>
                    <Label htmlFor="imgParticipate">参与奖底图 (第4名及以后)</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="imgParticipate"
                        type="url"
                        value={config.imgParticipate}
                        onChange={(e) =>
                          setConfig({ ...config, imgParticipate: e.target.value })
                        }
                        placeholder="https://example.com/cert/participate.jpg"
                        className="flex-1"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        id="uploadParticipate"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload('participate', file)
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('uploadParticipate')?.click()}
                        disabled={uploading.participate}
                      >
                        {uploading.participate ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    {config.imgParticipate && (
                      <div className="mt-2">
                        <img
                          src={config.imgParticipate}
                          alt="参与奖底图预览"
                          className="max-w-xs max-h-64 object-contain rounded border border-gray-200 bg-gray-50"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-3">
                  <Button
                    onClick={loadConfig}
                    disabled={configLoading || (configType === 'week' && (!configWeek || !configYear))}
                    variant="outline"
                    className="flex-1"
                  >
                    {configLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        加载中...
                      </>
                    ) : (
                      '加载配置'
                    )}
                  </Button>
                  <Button
                    onClick={saveConfig}
                    disabled={configSaving}
                    className="flex-1"
                  >
                    {configSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      '保存配置'
                    )}
                  </Button>
                </div>

                {/* 配置结果 */}
                {configResult && (
                  <div
                    className={`p-4 rounded-lg ${
                      configResult.success
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {configResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      )}
                      <div className="text-sm text-gray-600">
                        {configResult.message}
                      </div>
                    </div>
                  </div>
                )}

                {/* 配置说明 */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">配置说明</h4>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                    <li>
                      <strong>默认配置</strong>：当某周没有特殊配置时，使用默认配置的底图
                    </li>
                    <li>
                      <strong>指定周配置</strong>：可以为特定周设置特殊的底图（如节日限定）
                    </li>
                    <li>可以点击上传按钮上传图片到OSS，或直接输入图片URL</li>
                    <li>上传成功后，URL会自动填充到输入框</li>
                    <li>配置优先级：指定周配置 &gt; 默认配置</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

