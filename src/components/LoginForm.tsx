'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface LoginFormProps {
  onSuccess?: () => void
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mailSent, setMailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({ email })

      if (error) {
        if (error.message.includes('rate limit')) {
          alert(
            'メール送信が多すぎます。\n\n5～10分待ってからもう一度試してください。\nそれでも届かない場合は別のメールアドレスをお試しください。'
          )
        } else if (error.message.includes('invalid')) {
          alert('メールアドレスが無効です。\n\n正しいメールアドレスを入力してください。')
        } else {
          alert(`ログインエラー: ${error.message}`)
        }
        return
      }

      setMailSent(true)
      alert(
        'メールを送信しました。受信トレイを確認してください。\n\nメールが見つからない場合は以下を確認してください：\n・迷惑メールフォルダ\n・メールアドレスが正しいか\n・5～10分待つ（メール配信に時間がかかる場合があります）'
      )
      setEmail('')
      onSuccess?.()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'ログインに失敗しました'
      alert(`エラーが発生しました: ${msg}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-200 mb-2">
          メールアドレス
        </label>
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
          className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 transition duration-200 bg-gray-800 text-white placeholder-gray-500 disabled:opacity-50"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className={`w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-110 hover:shadow-xl cursor-pointer active:scale-95 ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isLoading ? '送信中...' : 'メールでログイン'}
      </button>
      {mailSent && (
        <div className="mt-4 p-4 bg-cyan-900 bg-opacity-30 border border-cyan-500 rounded-lg">
          <p className="text-cyan-300 text-sm">
            メールを送信しました。上記のメールアドレスで再送信できます。
          </p>
        </div>
      )}
    </form>
  )
}
