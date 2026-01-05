'use client'

interface FlipCountdownProps {
  hours: number
  minutes: number
}

function DigitCard({ digit }: { digit: number }) {
  return (
    <div className="relative w-12 h-16 bg-gradient-to-b from-gray-800 to-gray-900 rounded-md shadow-lg overflow-hidden flex-shrink-0">
      {/* 上半部分背景 */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gray-900 border-b border-gray-700/50"></div>
      {/* 下半部分背景 */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gray-800"></div>
      {/* 数字显示在中间 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white text-3xl font-bold">{digit}</span>
      </div>
      {/* 中间分割线 */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-600/50"></div>
      {/* 顶部高光 */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-b from-white/20 to-transparent"></div>
    </div>
  )
}

export function FlipCountdown({ hours, minutes }: FlipCountdownProps) {
  // 直接从 props 获取时间，由父组件控制更新
  return (
    <div className="flex items-center justify-center gap-2 whitespace-nowrap">
      {/* 小时 */}
      <div className="flex gap-1.5">
        <DigitCard digit={Math.floor(hours / 10)} />
        <DigitCard digit={hours % 10} />
      </div>

      <span className="text-2xl font-bold text-gray-400 mx-1">:</span>

      {/* 分钟 */}
      <div className="flex gap-1.5">
        <DigitCard digit={Math.floor(minutes / 10)} />
        <DigitCard digit={minutes % 10} />
      </div>
    </div>
  )
}
