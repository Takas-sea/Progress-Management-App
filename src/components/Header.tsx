'use client'

interface HeaderProps {
  onLogout: () => void | Promise<void>
}

export const Header = ({ onLogout }: HeaderProps) => {
  return (
    <div className="relative z-10 bg-gray-900 bg-opacity-80 backdrop-blur-md text-white p-6 shadow-lg border-b border-gray-700">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Study Logs</h1>
          <p className="text-cyan-300 mt-1">学習記録管理アプリ</p>
        </div>
        <button
          onClick={onLogout}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 transform hover:shadow-lg hover:scale-105 cursor-pointer active:scale-95"
        >
          ログアウト
        </button>
      </div>
    </div>
  )
}
