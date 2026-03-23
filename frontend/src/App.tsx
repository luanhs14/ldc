import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './layouts/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SalaoList from './pages/SalaoList'
import SalaoDetail from './pages/SalaoDetail'
import SalaoForm from './pages/SalaoForm'
import ElementosPage from './pages/ElementosPage'
import VisitaForm from './pages/VisitaForm'
import VisitaDetail from './pages/VisitaDetail'
import AvaliacoesPage from './pages/AvaliacoesPage'
import IncidentesPage from './pages/IncidentesPage'
import PessoasPage from './pages/PessoasPage'
import FinanceiroPage from './pages/FinanceiroPage'
import UsuariosPage from './pages/UsuariosPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" />
  if (user?.role !== 'ADMIN') return <Navigate to="/" />
  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />

          {/* Salões */}
          <Route path="saloes" element={<SalaoList />} />
          <Route path="saloes/novo" element={<SalaoForm />} />
          <Route path="saloes/:id" element={<SalaoDetail />} />
          <Route path="saloes/:id/editar" element={<SalaoForm />} />

          {/* Elementos */}
          <Route path="saloes/:id/elementos" element={<ElementosPage />} />

          {/* Visitas */}
          <Route path="saloes/:id/visitas/nova" element={<VisitaForm />} />
          <Route path="visitas/:id" element={<VisitaDetail />} />

          {/* Avaliações */}
          <Route path="saloes/:id/avaliacoes" element={<AvaliacoesPage />} />

          {/* Incidentes */}
          <Route path="saloes/:id/incidentes" element={<IncidentesPage />} />

          {/* Pessoas */}
          <Route path="pessoas" element={<PessoasPage />} />

          {/* Financeiro */}
          <Route path="financeiro" element={<FinanceiroPage />} />

          {/* Usuários — somente ADMIN */}
          <Route path="usuarios" element={<AdminRoute><UsuariosPage /></AdminRoute>} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
