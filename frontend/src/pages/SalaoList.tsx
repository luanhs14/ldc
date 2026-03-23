import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import type { Salao } from '../types'

export default function SalaoList() {
  const [saloes, setSaloes] = useState<Salao[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  const fetchSaloes = (b?: string) => {
    const params: any = {}
    const q = b !== undefined ? b : busca
    if (q) params.busca = q
    api.get('/saloes', { params }).then((res) => {
      setSaloes(res.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { fetchSaloes() }, [])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchSaloes() }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Salões do Reino</h1>
        <Link to="/saloes/novo" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
          + Novo Salão
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por congregação ou código BRA..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-200 font-medium">
            Buscar
          </button>
        </form>
      </div>

      {loading ? (
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
        </div>
      )}
    </div>
  )
}
