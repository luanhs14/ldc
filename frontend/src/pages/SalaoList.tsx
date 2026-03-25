import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import type { Salao } from '../types'
import PaginationControls from '../components/PaginationControls'
import { getListMeta } from '../services/pagination'

export default function SalaoList() {
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('congregacao')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const sortKey = `${sortBy}:${sortOrder}`
  const handleSortChange = (val: string) => {
    const [by, order] = val.split(':')
    setPage(1)
    setSortBy(by)
    setSortOrder(order as 'asc' | 'desc')
  }

  const { data, isLoading } = useQuery({
    queryKey: ['saloes', { page, sortBy, sortOrder }],
    queryFn: async () => {
      const res = await api.get('/saloes', { params: { page, pageSize: 10, sortBy, sortOrder } })
      return { items: res.data as Salao[], meta: getListMeta(res.headers) }
    },
    placeholderData: (prev) => prev,
  })

  const saloes = data?.items ?? []
  const meta = data?.meta ?? { page: 1, pageSize: 10, totalCount: 0, totalPages: 1, sortBy: 'congregacao', sortOrder: 'asc' as const }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Salões do Reino</h1>
        <Link to="/saloes/novo" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
          + Novo Salão
        </Link>
      </div>

      <div className="flex justify-end">
        <select
          value={sortKey}
          onChange={(e) => handleSortChange(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="congregacao:asc">Congregação A→Z</option>
          <option value="congregacao:desc">Congregação Z→A</option>
          <option value="codigoBRA:asc">Código BRA A→Z</option>
          <option value="codigoBRA:desc">Código BRA Z→A</option>
          <option value="atualizadoEm:desc">Atualização (recente)</option>
          <option value="atualizadoEm:asc">Atualização (antigo)</option>
        </select>
      </div>

      {isLoading && !data ? (
        <div className="text-center py-16 text-gray-400 text-sm">Carregando...</div>
      ) : saloes.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">Nenhum salão encontrado</div>
      ) : (
        <div className="space-y-2">
          {saloes.map((salao) => {
            const pendentes = salao._count?.pendencias || 0
            return (
              <Link
                key={salao.id}
                to={`/saloes/${salao.id}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4 hover:border-blue-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-gray-900">{salao.congregacao}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{salao.codigoBRA}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">

                      {salao.bairro && <span className="text-xs text-gray-400">{salao.bairro}</span>}{salao.congregacoes && salao.congregacoes.length > 0 && (
                        <>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-gray-400">
                            {salao.congregacoes.map((c) => c.nome).join(', ')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {pendentes > 0 ? (
                      <div className="text-center">
                        <span className="text-lg font-bold text-amber-500">{pendentes}</span>
                        <p className="text-xs text-gray-400 leading-none">pendente{pendentes !== 1 ? 's' : ''}</p>
                      </div>
                    ) : (
                      <span className="text-green-400 text-lg">✓</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
          <PaginationControls meta={meta} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
