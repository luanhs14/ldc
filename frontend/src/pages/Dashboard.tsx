import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

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

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard').then((res) => { setData(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center py-24 text-gray-400 text-sm">Carregando...</div>
  if (!data) return <div className="flex items-center justify-center py-24 text-red-500 text-sm">Erro ao carregar dados</div>

  const { alertas } = data
  const totalAlertas = alertas.pendenciasAtrasadas.length + alertas.elementosCriticos.length +
    alertas.garantiasVencendo.length + alertas.saloesSemAvaliacao.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Visão Geral</h1>
        <span className="text-xs text-gray-400">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>

      {/* Período ativo */}
      {alertas.periodosAtivos.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
          <p className="text-sm font-medium text-blue-800">
            📅 Período ativo: {alertas.periodosAtivos.map((p) => p.nome).join(', ')}
          </p>
          <p className="text-xs text-blue-600 mt-0.5">
            Cronogramas de manutenção foram gerados automaticamente para todos os salões.
          </p>
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link to="/saloes" className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:border-blue-200 transition-colors">
          <div className="text-2xl font-bold text-gray-900">{data.totalSaloes}</div>
          <div className="text-xs text-gray-500 mt-1">Salões</div>
        </Link>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-2xl font-bold text-amber-500">{data.totalPendencias}</div>
          <div className="text-xs text-gray-500 mt-1">Pendências abertas</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-2xl font-bold text-red-500">{data.pendenciasAltas}</div>
          <div className="text-xs text-gray-500 mt-1">Alta prioridade</div>
        </div>
        <div className={`rounded-xl shadow-sm border p-4 ${data.incidentesAbertos > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
          <div className={`text-2xl font-bold ${data.incidentesAbertos > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {data.incidentesAbertos}
          </div>
          <div className="text-xs text-gray-500 mt-1">Incidentes abertos</div>
        </div>
      </div>

      {/* Alertas */}
      {totalAlertas > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pendências atrasadas */}
          {alertas.pendenciasAtrasadas.length > 0 && (
            <AlertaCard titulo="Pendências atrasadas" count={alertas.pendenciasAtrasadas.length} cor="red">
              {alertas.pendenciasAtrasadas.slice(0, 5).map((p) => (
                <Link key={p.id} to={`/saloes/${p.salao.id}`} className="block hover:opacity-80">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-red-600 shrink-0">{p.salao.codigoBRA}</span>
                    <span className="text-xs text-gray-600 truncate">{p.descricao}</span>
                  </div>
                  <p className="text-xs text-red-400 mt-0.5 ml-0">
                    Prazo: {new Date(p.dataLimite).toLocaleDateString('pt-BR')}
                    {p.elemento && ` · ${p.elemento.elementoTipo.nome}`}
                  </p>
                </Link>
              ))}
              {alertas.pendenciasAtrasadas.length > 5 && (
                <p className="text-xs text-gray-400 text-center">+{alertas.pendenciasAtrasadas.length - 5} mais</p>
              )}
            </AlertaCard>
          )}

          {/* Elementos críticos */}
          {alertas.elementosCriticos.length > 0 && (
            <AlertaCard titulo="Elementos em estado crítico/ruim" count={alertas.elementosCriticos.length} cor="orange">
              {alertas.elementosCriticos.slice(0, 5).map((el) => (
                <Link key={el.id} to={`/saloes/${el.salao.id}`} className="block hover:opacity-80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-orange-600 shrink-0">{el.salao.codigoBRA}</span>
                    <span className="text-xs text-gray-600">{el.elementoTipo.nome}</span>
                    <span className={`text-xs ml-auto font-medium ${el.condicaoAtual === 'CRITICO' ? 'text-red-600' : 'text-orange-600'}`}>
                      {el.condicaoAtual}
                    </span>
                  </div>
                </Link>
              ))}
            </AlertaCard>
          )}

          {/* Garantias vencendo */}
          {alertas.garantiasVencendo.length > 0 && (
            <AlertaCard titulo="Garantias vencendo (30 dias)" count={alertas.garantiasVencendo.length} cor="amber">
              {alertas.garantiasVencendo.slice(0, 5).map((eq) => (
                <Link key={eq.id} to={`/saloes/${eq.elemento.salao.id}`} className="block hover:opacity-80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-amber-600 shrink-0">{eq.elemento.salao.congregacao}</span>
                    <span className="text-xs text-gray-600 truncate">{eq.nome}</span>
                  </div>
                  <p className="text-xs text-amber-500 mt-0.5">
                    Vence: {new Date(eq.garantiaAte).toLocaleDateString('pt-BR')} · {eq.elemento.elementoTipo.nome}
                  </p>
                </Link>
              ))}
            </AlertaCard>
          )}

          {/* Salões sem avaliação */}
          {alertas.saloesSemAvaliacao.length > 0 && (
            <AlertaCard titulo="Sem avaliação nos últimos 12 meses" count={alertas.saloesSemAvaliacao.length} cor="gray">
              {alertas.saloesSemAvaliacao.slice(0, 5).map((s) => (
                <Link key={s.id} to={`/saloes/${s.id}`} className="block hover:opacity-80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600">{s.codigoBRA}</span>
                    <span className="text-xs text-gray-500">{s.congregacao}</span>
                  </div>
                </Link>
              ))}
              {alertas.saloesSemAvaliacao.length > 5 && (
                <p className="text-xs text-gray-400 text-center">+{alertas.saloesSemAvaliacao.length - 5} mais</p>
              )}
            </AlertaCard>
          )}
        </div>
      )}

      {totalAlertas === 0 && (
        <div className="bg-green-50 border border-green-100 rounded-xl px-5 py-8 text-center">
          <p className="text-green-700 font-medium">✅ Nenhum alerta no momento</p>
          <p className="text-xs text-green-500 mt-1">Todos os salões estão em dia.</p>
        </div>
      )}

      {/* Avaliações recentes */}
      {data.avaliacoesRecentes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">Avaliações recentes</h2>
          </div>
          <ul className="divide-y divide-gray-50">
            {data.avaliacoesRecentes.map((av) => (
              <li key={av.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-700">{av.salao.codigoBRA} — {av.salao.congregacao}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{av.tipo}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(av.data).toLocaleDateString('pt-BR')} · {av.avaliador}
                  </p>
                </div>
                <Link to={`/saloes/${av.salao.id}`} className="text-xs text-blue-500 hover:text-blue-700">Ver →</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function AlertaCard({ titulo, count, cor, children }: {
  titulo: string; count: number; cor: string; children: React.ReactNode
}) {
  const colors: Record<string, string> = {
    red: 'border-red-100 bg-red-50', orange: 'border-orange-100 bg-orange-50',
    amber: 'border-amber-100 bg-amber-50', gray: 'border-gray-200 bg-gray-50',
  }
  const badgeColors: Record<string, string> = {
    red: 'bg-red-100 text-red-600', orange: 'bg-orange-100 text-orange-600',
    amber: 'bg-amber-100 text-amber-600', gray: 'bg-gray-200 text-gray-600',
  }
  return (
    <div className={`rounded-xl border ${colors[cor]}`}>
      <div className="px-4 py-3 border-b border-white border-opacity-50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">{titulo}</h3>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColors[cor]}`}>{count}</span>
      </div>
      <div className="px-4 py-3 space-y-2">{children}</div>
    </div>
  )
}
