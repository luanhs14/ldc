import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AlterarSenhaModal from '../components/AlterarSenhaModal'

const navItems = [
  { path: '/', label: 'Visão Geral' },
  { path: '/saloes', label: 'BRAs' },
  { path: '/pessoas', label: 'Pessoas' },
  { path: '/financeiro', label: 'Financeiro' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [alterarSenha, setAlterarSenha] = useState(false)

  const allNavItems = [
    ...navItems,
    ...(user?.role === 'ADMIN' ? [{ path: '/usuarios', label: 'Usuários' }] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between h-14">
            <div className="flex items-center gap-6">
              <Link to="/" className="text-base font-bold text-gray-900 tracking-tight">LDC</Link>
              <div className="flex gap-1 overflow-x-auto">
                {allNavItems.map((item) => {
                  const active = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
                  return (
                    <Link key={item.path} to={item.path}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        active ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                      }`}>
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setAlterarSenha(true)}
                className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-800 transition-colors"
                title="Alterar senha"
              >
                {user?.nome}
              </button>
              <button onClick={logout} className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium">
                Sair
              </button>
            </div>
            {alterarSenha && <AlterarSenhaModal onClose={() => setAlterarSenha(false)} />}
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}
