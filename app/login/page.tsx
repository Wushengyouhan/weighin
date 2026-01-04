'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/store/auth-store'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [countryCode, setCountryCode] = useState('+86')
  const [countdown, setCountdown] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showCodeDialog, setShowCodeDialog] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')

  // 验证码倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // 从localStorage恢复倒计时状态
  useEffect(() => {
    const savedCountdown = localStorage.getItem('sms_countdown')
    const savedTime = localStorage.getItem('sms_countdown_time')
    if (savedCountdown && savedTime) {
      const remaining = Math.max(
        0,
        60 - Math.floor((Date.now() - parseInt(savedTime)) / 1000)
      )
      if (remaining > 0) {
        setCountdown(remaining)
      }
    }
  }, [])

  // 保存倒计时状态
  useEffect(() => {
    if (countdown > 0) {
      localStorage.setItem('sms_countdown', countdown.toString())
      localStorage.setItem('sms_countdown_time', Date.now().toString())
    } else {
      localStorage.removeItem('sms_countdown')
      localStorage.removeItem('sms_countdown_time')
    }
  }, [countdown])

  const handleSendCode = async () => {
    if (!phone || phone.length !== 11) {
      alert('请输入正确的手机号')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (data.code === 200) {
        setCountdown(60)
        // 显示验证码弹框
        setVerificationCode(data.data.code)
        setShowCodeDialog(true)
      } else {
        alert(data.msg || '发送验证码失败')
      }
    } catch (error) {
      console.error('发送验证码失败:', error)
      alert('发送验证码失败，请稍后再试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!phone || !code) {
      alert('请输入手机号和验证码')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code }),
      })

      const data = await response.json()

      if (data.code === 200) {
        // 保存 token 和用户信息
        login(data.data.token, data.data.user)

        // 跳转到主页
        router.push('/home')
      } else {
        alert(data.msg || '登录失败')
      }
    } catch (error) {
      console.error('登录失败:', error)
      alert('登录失败，请稍后再试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 顶部导航栏 */}
      <header className="border-b border-gray-100">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <span className="text-xl font-semibold">WeighIn</span>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md p-12 shadow-2xl border-0 bg-gradient-to-br from-purple-50 via-pink-50 via-blue-50 to-indigo-50 relative overflow-hidden">
          {/* 装饰性背景元素 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl"></div>

          <div className="relative space-y-10">
            {/* Logo区域 */}
            <div className="flex flex-col items-center gap-4 pb-2">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-105 transition-transform">
                <span className="text-white font-bold text-4xl">W</span>
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                WeighIn
              </span>
              <p className="text-sm text-gray-500 mt-1">体重管理，轻松坚持</p>
            </div>

            {/* 手机号输入 */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="w-24 border-purple-200 focus:border-purple-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+86">+86</SelectItem>
                    <SelectItem value="+1">+1</SelectItem>
                    <SelectItem value="+852">+852</SelectItem>
                    <SelectItem value="+853">+853</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="tel"
                  placeholder="输入手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 border-purple-200 focus:border-purple-400 focus:ring-purple-200"
                  maxLength={11}
                />
              </div>
            </div>

            {/* 验证码输入 */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 border-purple-200 focus:border-purple-400 focus:ring-purple-200"
                  maxLength={6}
                />
                <Button
                  variant="outline"
                  onClick={handleSendCode}
                  disabled={
                    !phone || phone.length !== 11 || countdown > 0 || isLoading
                  }
                  className="whitespace-nowrap border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-400"
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </Button>
              </div>
            </div>

            {/* 登录/注册按钮 */}
            <Button
              onClick={handleLogin}
              disabled={!phone || !code || isLoading}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg"
              size="lg"
            >
              {isLoading ? '处理中...' : '登录 / 注册'}
            </Button>
          </div>
        </Card>
      </main>

      {/* 底部协议 */}
      <footer className="border-t border-gray-100 py-6">
        <div className="max-w-md mx-auto px-6">
          <p className="text-xs text-center text-gray-500">
            注册或登录即代表您同意
            <button className="text-gray-900 hover:underline mx-1">
              《用户协议》
            </button>
            和
            <button className="text-gray-900 hover:underline mx-1">
              《隐私协议》
            </button>
          </p>
        </div>
      </footer>

      {/* 验证码弹框 */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>验证码</DialogTitle>
            <DialogDescription>
              模拟短信发送，您的验证码是：
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-4">
                {verificationCode}
              </div>
              <p className="text-sm text-gray-500">
                验证码有效期5分钟，请妥善保管
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setShowCodeDialog(false)
              setCode(verificationCode)
            }}
            className="w-full"
          >
            复制验证码
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

