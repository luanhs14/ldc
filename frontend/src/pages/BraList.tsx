import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

interface Bra {
  id: string
  codigo: string
  responsavel: string
  status: string
  prioridade: string
  mesReferencia: string
  atualizadoEm: string
  _count: { acoes: number; pendentes: number }
}

const statusLabels: Record<string, string> = {
  A_FAZER: 'A Fazer',
  EM_ANDAMENTO: 'Em Andamento',
  AGUARDANDO_TERCEIROS: 'Aguardando Terceiros',
  CONCLUIDO: 'Concluído',
}

const statusColors: Record<string, string> = {
  A_FAZER: 'bg-gray-100 text-gray-600',
  EM_ANDAMENTO: 'bg-blue-100 text-blue-700',
  AGUARDANDO_TERCEIROS: 'bg-amber-100 text-amber-700',
  CONCLUIDO: 'bg-green-100 text-green-700',
}

const prioridadeColors: Record<string, string> = {
  BAIXA: 'text-green-600',
  MEDIA: 'text-amber-600',
  ALTA: 'text-red-600',
}

export default function BraList() {
  const [bras, setBras] = useState<Bra[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroPrioridade, setFiltroPrioridade] = useState('')
  const [busca, setBusca] = useState('')

  const fetchBras = (buscaAtual?: string) => {
    const params: any = {}
    if (filtroStatus) params.status = filtroStatus
    if (filtroPrioridade) params.prioridade = filtroPrioridade
    const b = buscaAtual !== undefined ? buscaAtual : busca
    if (b) params.busca = b

    api.get('/bras', { params }).then((res) => {
      setBras(res.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { fetchBras() }, [filtroStatus, filtroPrioridade])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchBras()
  }

  const getProgresso = (bra: Bra) => {
    const total = bra._count.acoes
    if (total === 0) return null
    const concluidas = total - bra._count.pendentes
    return { total, concluidas, pct: Math.round((concluidas / total) * 100) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">BRAs</h1>
        <Link
          to="/bras/novo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          + Novo BRA
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {Object.entries(statusLabels).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Prioridade</label>
            <select
              value={filtroPrioridade}
              onChange={(e) => setFiltroPrioridade(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              <option value="BAIXA">Baixa</option>
              <option value="MEDIA">Média</option>
              <option value="ALTA">Alta</option>
            </select>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar código ou responsável..."
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-200 transition-colors font-medium"
            >
              Buscar
            </button>
          </form>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Carregando...</div>
      ) : bras.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">Nenhum BRA encontrado</div>
      ) : (
        <div className="space-y-2">
          {bras.map((bra) => {
            const prog = getProgresso(bra)
            const concluido = bra.status === 'CONCLUIDO'
            return (
              <Link
                key={bra.id}
                to={`/bras/${bra.id}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4 hover:border-blue-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{bra.codigo}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[bra.status]}`}>
                        {statusLabels[bra.status]}
                      </span>
                      {bra.prioridade === 'ALTA' && (
                        <span className={`text-xs font-medium ${prioridadeColors[bra.prioridade]}`}>
                          ⚠ Alta prioridade
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">{bra.responsavel}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{bra.mesReferencia}</span>
                    </div>

                    {/* Barra de progresso */}
                    {prog ? (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400">
                            {prog.concluidas}/{prog.total} ações
                          </span>
                          <span className="text-xs font-medium text-gray-500">{prog.pct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              concluido || prog.pct === 100 ? 'bg-green-500' :
                              prog.pct > 50 ? 'bg-blue-400' : 'bg-amber-400'
                            }`}
                            style={{ width: `${prog.pct}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-300 mt-2">Sem ações cadastradas</p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    {prog && prog.concluidas < prog.total ? (
                      <div className="text-center">
                        <span className="text-lg font-bold text-amber-500">{prog.total - prog.concluidas}</span>
                        <p className="text-xs text-gray-400 leading-none">pendentes</p>
                      </div>
                    ) : prog && prog.pct === 100 ? (
                      <span className="text-xl">✅</span>
                    ) : null}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
