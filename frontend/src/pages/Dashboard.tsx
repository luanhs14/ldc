import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

interface DashboardData {
  totalSaloes: number
  totalPendencias: number
  pendenciasAltas: number
  incidentesAbertos: number
  alertas: {
    pendenciasAtrasadas: Array<{
      id: string; descricao: string; dataLimite: string; prioridade: string
      salao: { id: string; congregacao: string; codigoBRA: string }
      elemento?: { elementoTipo: { nome: string } }
    }>
    elementosCriticos: Array<{
      id: string; condicaoAtual: string
      salao: { id: string; congregacao: string; codigoBRA: string }
      elementoTipo: { nome: string }
    }>
    garantiasVencendo: Array<{
      id: string; nome: string; garantiaAte: string
      elemento: { salao: { id: string; congregacao: string }; elementoTipo: { nome: string } }
    }>
    saloesSemAvaliacao: Array<{ id: string; congregacao: string; codigoBRA: string }>
    periodosAtivos: Array<{ id: string; nome: string; mesInicio: number; mesFim: number }>
  }
  avaliacoesRecentes: Array<{
    id: string; tipo: string; data: string; avaliador: string
    salao: { id: string; congregacao: string; codigoBRA: string }
  }>
}

function getSaudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function primeiroNome(nome: string) {
  return nome.split(' ')[0]
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    api.get('/dashboard').then((res) => { setData(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center py-24 text-gray-400 text-sm">Carregando...</div>
  if (!data) return <div className="flex items-center justify-center py-24 text-red-500 text-sm">Erro ao carregar dados</div>

  const { alertas } = data
  const totalAlertas = alertas.pendenciasAtrasadas.length + alertas.elementosCriticos.length +
    alertas.garantiasVencendo.length + alertas.saloesSemAvaliacao.length

  // Alertas ordenados por gravidade
  const blocosAlertas = [
    {
      key: 'pendencias',
      ativo: alertas.pendenciasAtrasadas.length > 0,
      titulo: 'Pendências atrasadas',
      count: alertas.pendenciasAtrasadas.length,
      cor: 'red' as const,
      items: alertas.pendenciasAtrasadas.slice(0, 5),
      render: (p: typeof alertas.pendenciasAtrasadas[0]) => (
        <Link key={p.id} to={`/saloes/${p.salao.id}`} className="block hover:opacity-75">
          <div className="flex items-start gap-2">
            <span className="text-xs font-semibold text-red-600 shrink-0">{p.salao.codigoBRA}</span>
            <span className="text-xs text-gray-600 truncate">{p.descricao}</span>
          </div>
          <p className="text-xs text-red-400 mt-0.5">
            Prazo: {new Date(p.dataLimite).toLocaleDateString('pt-BR')}
            {p.elemento && ` · ${p.elemento.elementoTipo.nome}`}
          </p>
        </Link>
      ),
      extra: alertas.pendenciasAtrasadas.length > 5 ? alertas.pendenciasAtrasadas.length - 5 : 0,
    },
    {
      key: 'criticos',
      ativo: alertas.elementosCriticos.length > 0,
      titulo: 'Elementos em estado crítico',
      count: alertas.elementosCriticos.length,
      cor: 'orange' as const,
      items: alertas.elementosCriticos.slice(0, 5),
      render: (el: typeof alertas.elementosCriticos[0]) => (
        <Link key={el.id} to={`/saloes/${el.salao.id}`} className="block hover:opacity-75">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-orange-600 shrink-0">{el.salao.codigoBRA}</span>
            <span className="text-xs text-gray-600 flex-1">{el.elementoTipo.nome}</span>
            <span className={`text-xs font-semibold ${el.condicaoAtual === 'CRITICO' ? 'text-red-600' : 'text-orange-500'}`}>
              {el.condicaoAtual}
            </span>
          </div>
        </Link>
      ),
      extra: 0,
    },
    {
      key: 'garantias',
      ativo: alertas.garantiasVencendo.length > 0,
      titulo: 'Garantias vencendo em 30 dias',
      count: alertas.garantiasVencendo.length,
      cor: 'amber' as const,
      items: alertas.garantiasVencendo.slice(0, 5),
      render: (eq: typeof alertas.garantiasVencendo[0]) => (
        <Link key={eq.id} to={`/saloes/${eq.elemento.salao.id}`} className="block hover:opacity-75">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-600 shrink-0">{eq.elemento.salao.congregacao}</span>
            <span className="text-xs text-gray-600 truncate flex-1">{eq.nome}</span>
          </div>
          <p className="text-xs text-amber-500 mt-0.5">
            Vence: {new Date(eq.garantiaAte).toLocaleDateString('pt-BR')} · {eq.elemento.elementoTipo.nome}
          </p>
        </Link>
      ),
      extra: 0,
    },
    {
      key: 'semAvaliacao',
      ativo: alertas.saloesSemAvaliacao.length > 0,
      titulo: 'Sem avaliação há 12 meses',
      count: alertas.saloesSemAvaliacao.length,
      cor: 'gray' as const,
      items: alertas.saloesSemAvaliacao.slice(0, 5),
      render: (s: typeof alertas.saloesSemAvaliacao[0]) => (
        <Link key={s.id} to={`/saloes/${s.id}`} className="block hover:opacity-75">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">{s.codigoBRA}</span>
            <span className="text-xs text-gray-500">{s.congregacao}</span>
          </div>
        </Link>
      ),
      extra: alertas.saloesSemAvaliacao.length > 5 ? alertas.saloesSemAvaliacao.length - 5 : 0,
    },
  ].filter((b) => b.ativo)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{getSaudacao()}{user ? `, ${primeiroNome(user.nome)}` : ''}</h1>
        </div>
        <span className="text-xs text-gray-400 mt-1 text-right">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Período ativo */}
      {alertas.periodosAtivos.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3">
          <p className="text-sm font-medium text-blue-800">
            Período ativo: {alertas.periodosAtivos.map((p) => p.nome).join(', ')}
          </p>
          <p className="text-xs text-blue-500 mt-0.5">Cronogramas gerados automaticamente para todos os salões.</p>
        </div>
      )}

      {/* Atalhos rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/saloes" className="bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-blue-300 hover:shadow-sm transition-all group">
          <p className="text-sm font-semibold text-gray-700 group-hover:text-blue-700">Salões</p>
        </Link>
        <Link to="/pessoas" className="bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-purple-300 hover:shadow-sm transition-all group">
          <p className="text-sm font-semibold text-gray-700 group-hover:text-purple-700">Pessoas</p>
        </Link>
        <Link to="/financeiro" className="bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-green-300 hover:shadow-sm transition-all group">
          <p className="text-sm font-semibold text-gray-700 group-hover:text-green-700">Financeiro</p>
        </Link>
        <Link to="/saloes" className="bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-amber-300 hover:shadow-sm transition-all group">
          <p className="text-sm font-semibold text-gray-700 group-hover:text-amber-700">Pendências</p>
        </Link>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Salões" value={data.totalSaloes} to="/saloes" status="neutral" />
        <SummaryCard label="Pendências abertas" value={data.totalPendencias} status={data.totalPendencias > 0 ? 'warn' : 'ok'} />
        <SummaryCard label="Alta prioridade" value={data.pendenciasAltas} status={data.pendenciasAltas > 0 ? 'critical' : 'ok'} />
        <SummaryCard label="Incidentes abertos" value={data.incidentesAbertos} status={data.incidentesAbertos > 0 ? 'critical' : 'ok'} />
      </div>

      {/* Alertas */}
      {blocosAlertas.length > 0 ? (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Alertas — {totalAlertas} item{totalAlertas !== 1 ? 's' : ''} requerem atenção
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {blocosAlertas.map((bloco) => (
              <AlertaCard key={bloco.key} titulo={bloco.titulo} count={bloco.count} cor={bloco.cor}>
                {bloco.items.map((item: any) => bloco.render(item))}
                {bloco.extra > 0 && (
                  <p className="text-xs text-gray-400 text-center pt-1">+{bloco.extra} mais</p>
                )}
              </AlertaCard>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-100 rounded-xl px-5 py-8 text-center">
          <p className="text-green-700 font-semibold">Tudo em ordem</p>
          <p className="text-xs text-green-500 mt-1">Nenhum alerta no momento. Todos os salões estão em dia.</p>
        </div>
      )}

      {/* Avaliações recentes */}
      {data.avaliacoesRecentes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-3.5 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">Avaliações recentes</h2>
          </div>
          <ul className="divide-y divide-gray-50">
            {data.avaliacoesRecentes.map((av) => (
              <li key={av.id} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 text-center shrink-0">
                  <p className="text-sm font-bold text-gray-800 leading-none">
                    {new Date(av.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(av.data).getFullYear()}
                  </p>
                </div>
                <div className="w-px h-8 bg-gray-100 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">{av.salao.codigoBRA}</span>
                    <span className="text-gray-300">—</span>
                    <span className="text-sm text-gray-600 truncate">{av.salao.congregacao}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{av.avaliador} · {av.tipo}</p>
                </div>
                <Link to={`/saloes/${av.salao.id}`} className="text-xs text-blue-500 hover:text-blue-700 shrink-0">
                  Ver →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, to, status }: {
  label: string; value: number; to?: string; status: 'ok' | 'warn' | 'critical' | 'neutral'
}) {
  const styles = {
    ok: 'border-green-100 bg-green-50',
    warn: 'border-amber-100 bg-amber-50',
    critical: 'border-red-100 bg-red-50',
    neutral: 'border-gray-100 bg-white',
  }
  const valueStyles = {
    ok: 'text-green-600',
    warn: 'text-amber-600',
    critical: 'text-red-600',
    neutral: 'text-gray-900',
  }
  const card = (
    <div className={`rounded-xl border p-4 transition-all ${styles[status]} ${to ? 'hover:shadow-sm hover:scale-[1.01]' : ''}`}>
      <div className={`text-2xl font-bold ${valueStyles[status]}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
  return to ? <Link to={to}>{card}</Link> : card
}

function AlertaCard({ titulo, count, cor, children }: {
  titulo: string; count: number; cor: 'red' | 'orange' | 'amber' | 'gray'; children: React.ReactNode
}) {
  const styles = {
    red:    { wrap: 'border-red-200 bg-red-50',       badge: 'bg-red-600 text-white',         bar: 'bg-red-500' },
    orange: { wrap: 'border-orange-200 bg-orange-50', badge: 'bg-orange-500 text-white',       bar: 'bg-orange-500' },
    amber:  { wrap: 'border-amber-200 bg-amber-50',   badge: 'bg-amber-500 text-white',        bar: 'bg-amber-400' },
    gray:   { wrap: 'border-gray-200 bg-gray-50',     badge: 'bg-gray-400 text-white',         bar: 'bg-gray-300' },
  }
  const s = styles[cor]
  return (
    <div className={`rounded-xl border overflow-hidden ${s.wrap}`}>
      <div className={`h-1 ${s.bar}`} />
      <div className="px-4 py-3 border-b border-white border-opacity-60 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">{titulo}</h3>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.badge}`}>{count}</span>
      </div>
      <div className="px-4 py-3 space-y-2.5">{children}</div>
    </div>
  )
}
