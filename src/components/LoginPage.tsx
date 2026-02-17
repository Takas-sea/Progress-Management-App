'use client'

import { LoginForm } from './LoginForm'
import { GoogleLoginButton } from './GoogleLoginButton'

interface LoginPageProps {
  onSuccess?: () => void
}

export const LoginPage = ({ onSuccess }: LoginPageProps) => {
  return (
    <div
      className="min-h-screen bg-center bg-fixed flex items-center justify-center p-4"
      style={{
        backgroundImage: "url('/images/black_00032.jpg')",
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* オーバーレイ */}
      <div className="absolute inset-0"></div>

      <div className="relative z-10 bg-gray-900 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Study Logs</h1>
          <p className="text-gray-300">学習内容を記録して、進捗を管理しましょう</p>
        </div>

        <LoginForm onSuccess={onSuccess} />

        {/* 区切り線 */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gray-900 text-gray-400">または</span>
          </div>
        </div>

        {/* Googleログインボタン */}
        <GoogleLoginButton />
      </div>
    </div>
  )
}
