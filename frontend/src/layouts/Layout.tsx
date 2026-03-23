import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
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
  const [menuAberto, setMenuAberto] = useState(false)
  const [userMenuAberto, setUserMenuAberto] = useState(false)

  const allNavItems = [
    ...navItems,
    ...(user?.role === 'ADMIN' ? [{ path: '/usuarios', label: 'Usuários' }] : []),
  ]

  const inicial = user?.nome?.charAt(0).toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between h-14">

            {/* Logo + Nav desktop */}
            <div className="flex items-center">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-1.5 shrink-0 mr-4">
                <span className="text-lg font-extrabold text-blue-500 tracking-wide leading-none">LDC</span>
              </Link>

              {/* Divisor vertical */}
              <div className="h-5 w-px bg-gray-200 mr-4 hidden sm:block" />

              {/* Nav items desktop */}
              <div className="hidden sm:flex h-full">
                {allNavItems.map((item) => {
                  const active = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`relative flex items-center px-3 text-sm font-medium transition-colors whitespace-nowrap ${
                        active
                          ? 'text-blue-700'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      {item.label}
                      {active && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-sm" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Área usuário desktop + hamburger mobile */}
            <div className="flex items-center gap-2">

              {/* Avatar + dropdown desktop */}
              <div className="hidden sm:block relative">
                <button
                  onClick={() => setUserMenuAberto((v) => !v)}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <span className="w-7 h-7 rounded-full bg-blue-400 text-white text-xs font-bold flex items-center justify-center select-none">
                    {inicial}
                  </span>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 max-w-[120px] truncate">
                    {user?.nome}
                  </span>
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenuAberto && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuAberto(false)} />
                    <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                      <button
                        onClick={() => { setAlterarSenha(true); setUserMenuAberto(false) }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Alterar senha
                      </button>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={() => { logout(); setUserMenuAberto(false) }}
                        className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Sair
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Hamburger mobile */}
              <button
                onClick={() => setMenuAberto((v) => !v)}
                className="sm:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Menu"
              >
                {menuAberto ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Menu mobile dropdown */}
        {menuAberto && (
          <div className="sm:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2 space-y-1">
            {allNavItems.map((item) => {
              const active = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuAberto(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600 pl-2.5'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
            <div className="border-t border-gray-100 pt-2 mt-2">
              <div className="flex items-center gap-2 px-3 py-2 mb-1">
                <span className="w-7 h-7 rounded-full bg-blue-400 text-white text-xs font-bold flex items-center justify-center select-none">
                  {inicial}
                </span>
                <span className="text-sm font-medium text-gray-700 truncate">{user?.nome}</span>
              </div>
              <button
                onClick={() => { setAlterarSenha(true); setMenuAberto(false) }}
                className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Alterar senha
              </button>
              <button
                onClick={() => { logout(); setMenuAberto(false) }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>

      {alterarSenha && <AlterarSenhaModal onClose={() => setAlterarSenha(false)} />}
    </div>
  )
}
