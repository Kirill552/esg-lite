import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Добро пожаловать в ESG-Lite
          </h1>
          <p className="text-slate-600">
            Войдите в систему для создания ESG отчётов
          </p>
        </div>
        
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-8">
          <SignIn 
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-none bg-transparent border-none',
                headerTitle: 'text-xl font-semibold text-slate-900',
                headerSubtitle: 'text-slate-600',
                socialButtonsBlockButton: 'bg-white hover:bg-gray-50 border border-gray-300 text-gray-700',
                formButtonPrimary: 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-medium',
                formFieldInput: 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500',
                footerActionLink: 'text-emerald-600 hover:text-emerald-700',
              }
            }}
            redirectUrl="/dashboard"
          />
        </div>
        
        <div className="text-center mt-6">
          <p className="text-sm text-slate-600">
            🌱 Экологичная цифровизация для российского бизнеса
          </p>
        </div>
      </div>
    </div>
  )
} 