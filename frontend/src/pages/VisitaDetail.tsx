import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import type { Visita, Pendencia } from '../types'
import { VISITA_TIPO_LABELS, PRIORIDADE_COLORS } from '../types'

export default function VisitaDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [visita, setVisita] = useState<Visita | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [erro, setErro] = useState('')

  const fetchVisita = () => {
    api.get(`/visitas/${id}`).then((res) => {
      setVisita(res.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { fetchVisita() }, [id])

  const handleTogglePendencia = async (p: Pendencia) => {
    setToggling(p.id)
    try {
      const novoStatus = p.status === 'CONCLUIDO' ? 'PENDENTE' : 'CONCLUIDO'
      await api.put(`/pendencias/${p.id}`, { status: novoStatus })
      fetchVisita()
    } catch { setErro('Erro ao atualizar pendência') }
    finally { setToggling(null) }
  }

  const handleExcluir = async () => {
    if (!confirm('Excluir esta visita?')) return
    try {
      await api.delete(`/visitas/${id}`)
      navigate(`/saloes/${visita?.salaoId}`)
    } catch { setErro('Erro ao excluir visita') }
  }

  if (loading) return <div className="flex items-center justify-center py-24 text-gray-400 text-sm">Carregando...</div>
  if (!visita) return <div className="flex items-center justify-center py-24 text-red-500 text-sm">Visita não encontrada</div>

  const pendencias: Pendencia[] = visita.pendencias || []
  const concluidas = pendencias.filter((p) => p.status === 'CONCLUIDO').length
  const progresso = pendencias.length > 0 ? Math.round((concluidas / pendencias.length) * 100) : 0

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex justify-between">
          {erro}<button onClick={() => setErro('')} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-sm text-gray-400 mb-1">
              <Link to={`/saloes/${visita.salaoId}`} className="hover:text-blue-500">← Voltar ao salão</Link>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{VISITA_TIPO_LABELS[visita.tipo] || visita.tipo}</h1>
            </div>
            <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
              <span>📅 {new Date(visita.data).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              {visita.visitanteNome && <span>· 👤 {visita.visitanteNome}</span>}
              {visita.congregacao && <span>· {visita.congregacao.nome}</span>}
            </div>
          </div>
          <button onClick={handleExcluir}
            className="text-sm text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-100 hover:border-red-200 transition-colors shrink-0">
            Excluir
          </button>
        </div>

        {visita.relatorio && (
          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Relatório</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{visita.relatorio}</p>
          </div>
        )}

        {/* Progresso das pendências */}
        {pendencias.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-500">Pendências desta visita</span>
              <span className="text-xs font-semibold text-gray-600">{concluidas}/{pendencias.length} resolvidas · {progresso}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${progresso === 100 ? 'bg-green-500' : progresso > 50 ? 'bg-blue-400' : 'bg-amber-400'}`}
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Checklist de pendências */}
      {pendencias.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Pendências identificadas</h2>
          </div>
          <ul className="divide-y divide-gray-50">
            {pendencias.map((p) => {
              const concluida = p.status === 'CONCLUIDO'
              const atrasada = p.status !== 'CONCLUIDO' && !!p.dataLimite && new Date(p.dataLimite) < new Date()
              return (
                <li key={p.id} className={`px-5 py-4 flex items-start gap-3 group ${atrasada ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                  <button
                    onClick={() => handleTogglePendencia(p)}
                    disabled={toggling === p.id}
                    className={`mt-0.5 w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                      concluida ? 'bg-green-500 border-green-500 text-white' :
                      atrasada ? 'border-red-300 hover:border-red-400' : 'border-gray-300 hover:border-blue-400'
                    } ${toggling === p.id ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    {concluida && (
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${concluida ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {p.descricao}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORIDADE_COLORS[p.prioridade]}`}>
                        {p.prioridade}
                      </span>
                      {p.elemento && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {p.elemento.elementoTipo?.nome}
                        </span>
                      )}
                      {p.responsavel && <span className="text-xs text-gray-400">👤 {p.responsavel}</span>}
                      {p.dataLimite && !concluida && (
                        <span className={`text-xs ${atrasada ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                          {atrasada ? '⚠ ' : '📅 '}{new Date(p.dataLimite).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {p.risco && (
                        <span className={`text-xs font-medium ${p.risco === 'ALTO' ? 'text-red-500' : p.risco === 'MEDIO' ? 'text-amber-500' : 'text-green-500'}`}>
                          ● Risco {p.risco.toLowerCase()}
                        </span>
                      )}
                      {p.concluidoEm && (
                        <span className="text-xs text-green-500">✓ {new Date(p.concluidoEm).toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="px-5 py-3 border-t border-gray-50 bg-gray-50 rounded-b-xl text-center">
            <p className="text-xs text-gray-400">
              {concluidas === pendencias.length && pendencias.length > 0
                ? '✅ Todas as pendências desta visita foram resolvidas!'
                : `${pendencias.length - concluidas} em aberto`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
