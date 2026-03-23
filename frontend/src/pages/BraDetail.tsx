import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

interface Acao {
  id: string
  tipo: string
  descricao: string
  responsavel: string
  dataPrevista: string | null
  dataConcluida: string | null
  resultado: string | null
  risco: string | null
  status: string
  criadoEm: string
}

interface BraData {
  id: string
  codigo: string
  responsavel: string
  status: string
  prioridade: string
  mesReferencia: string
  observacoes: string | null
  criadoEm: string
  atualizadoEm: string
  acoes: Acao[]
}

const statusColors: Record<string, string> = {
  A_FAZER: 'bg-gray-100 text-gray-700',
  EM_ANDAMENTO: 'bg-blue-100 text-blue-700',
  AGUARDANDO_TERCEIROS: 'bg-amber-100 text-amber-700',
  CONCLUIDO: 'bg-green-100 text-green-700',
}

const statusLabels: Record<string, string> = {
  A_FAZER: 'A Fazer',
  EM_ANDAMENTO: 'Em Andamento',
  AGUARDANDO_TERCEIROS: 'Aguardando Terceiros',
  CONCLUIDO: 'Concluído',
}

const prioridadeColors: Record<string, string> = {
  BAIXA: 'bg-green-100 text-green-700',
  MEDIA: 'bg-amber-100 text-amber-700',
  ALTA: 'bg-red-100 text-red-700',
}

const riscoColors: Record<string, string> = {
  BAIXO: 'text-green-600',
  MEDIO: 'text-amber-600',
  ALTO: 'text-red-600',
}

const tipoLabels: Record<string, string> = {
  VISITA: 'Visita',
  REUNIAO: 'Reunião',
  SHAREPOINT: 'SharePoint',
  BUILDER: 'Builder',
  INSPECAO: 'Inspeção',
  TELHADO: 'Telhado',
  CALHA: 'Calha',
  ESTRUTURA: 'Estrutura',
  ELETRICA: 'Elétrica',
  HIDRAULICA: 'Hidráulica',
  AUDIO_VIDEO: 'Áudio/Vídeo',
  OUTRO: 'Outro',
}

type Filtro = 'TODAS' | 'PENDENTES' | 'CONCLUIDAS'

export default function BraDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [bra, setBra] = useState<BraData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [erro, setErro] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('TODAS')
  const [toggling, setToggling] = useState<string | null>(null)

  const [novaAcao, setNovaAcao] = useState({
    tipo: 'VISITA',
    descricao: '',
    responsavel: '',
    dataPrevista: '',
    risco: '',
  })

  const fetchBra = () => {
    api.get(`/bras/${id}`).then((res) => {
      setBra(res.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { fetchBra() }, [id])

  const isAtrasada = (acao: Acao) =>
    acao.status !== 'CONCLUIDA' && !!acao.dataPrevista && new Date(acao.dataPrevista) < new Date()

  const total = bra?.acoes.length || 0
  const concluidas = bra?.acoes.filter((a) => a.status === 'CONCLUIDA').length || 0
  const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0

  const acoesFiltradas = bra?.acoes.filter((a) => {
    if (filtro === 'PENDENTES') return a.status !== 'CONCLUIDA'
    if (filtro === 'CONCLUIDAS') return a.status === 'CONCLUIDA'
    return true
  }) || []

  const handleToggle = async (acao: Acao) => {
    setToggling(acao.id)
    try {
      const novoStatus = acao.status === 'CONCLUIDA' ? 'ABERTA' : 'CONCLUIDA'
      await api.put(`/acoes/${acao.id}`, { status: novoStatus })
      fetchBra()
    } catch {
      setErro('Erro ao atualizar ação')
    } finally {
      setToggling(null)
    }
  }

  const handleAddAcao = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post(`/acoes/bras/${id}/acoes`, {
        ...novaAcao,
        risco: novaAcao.risco || undefined,
        dataPrevista: novaAcao.dataPrevista || undefined,
      })
      setShowForm(false)
      setNovaAcao({ tipo: 'VISITA', descricao: '', responsavel: '', dataPrevista: '', risco: '' })
      fetchBra()
    } catch (err: any) {
      setErro(err.response?.data?.error || 'Erro ao criar ação')
    }
  }

  const handleDeleteAcao = async (acaoId: string) => {
    if (!confirm('Excluir esta ação?')) return
    try {
      await api.delete(`/acoes/${acaoId}`)
      fetchBra()
    } catch {
      setErro('Erro ao excluir ação')
    }
  }

  const handleDeleteBra = async () => {
    if (!confirm('Tem certeza que deseja excluir este BRA?')) return
    try {
      await api.delete(`/bras/${id}`)
      navigate('/bras')
    } catch {
      setErro('Erro ao excluir BRA')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="text-gray-400 text-sm">Carregando...</div>
    </div>
  )
  if (!bra) return (
    <div className="flex items-center justify-center py-24">
      <div className="text-red-500 text-sm">BRA não encontrado</div>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          {erro}
          <button onClick={() => setErro('')} className="text-red-400 hover:text-red-600 ml-4">✕</button>
        </div>
      )}

      {/* Cabeçalho do BRA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{bra.codigo}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[bra.status]}`}>
                {statusLabels[bra.status]}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${prioridadeColors[bra.prioridade]}`}>
                {bra.prioridade === 'ALTA' ? '⚠ Alta' : bra.prioridade === 'MEDIA' ? 'Média' : 'Baixa'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {bra.responsavel} &middot; {bra.mesReferencia}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              to={`/bras/${id}/editar`}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              Editar
            </Link>
            <button
              onClick={handleDeleteBra}
              className="text-sm text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-100 hover:border-red-200 transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>

        {bra.observacoes && (
          <p className="text-sm text-gray-600 mb-4 bg-gray-50 rounded-lg px-3 py-2 whitespace-pre-wrap">
            {bra.observacoes}
          </p>
        )}

        {/* Barra de progresso */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-500">Progresso das ações</span>
            <span className="text-xs font-semibold text-gray-700">
              {concluidas}/{total} concluídas &middot; {progresso}%
            </span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progresso === 100 ? 'bg-green-500' : progresso > 50 ? 'bg-blue-500' : 'bg-amber-400'
              }`}
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist de Ações */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-sm font-semibold text-gray-800">Ações</h2>
            <div className="flex gap-1">
              {(['TODAS', 'PENDENTES', 'CONCLUIDAS'] as Filtro[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                    filtro === f ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {f === 'TODAS' ? `Todas (${total})` :
                   f === 'PENDENTES' ? `Pendentes (${total - concluidas})` :
                   `Concluídas (${concluidas})`}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            {showForm ? '✕ Cancelar' : '+ Nova ação'}
          </button>
        </div>

        {/* Formulário de nova ação */}
        {showForm && (
          <form onSubmit={handleAddAcao} className="px-6 py-4 border-b border-gray-100 bg-gray-50 space-y-3">
            <textarea
              value={novaAcao.descricao}
              onChange={(e) => setNovaAcao({ ...novaAcao, descricao: e.target.value })}
              placeholder="Descreva a ação..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              required
              autoFocus
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <select
                value={novaAcao.tipo}
                onChange={(e) => setNovaAcao({ ...novaAcao, tipo: e.target.value })}
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(tipoLabels).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <input
                type="text"
                value={novaAcao.responsavel}
                onChange={(e) => setNovaAcao({ ...novaAcao, responsavel: e.target.value })}
                placeholder="Responsável"
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={novaAcao.dataPrevista}
                onChange={(e) => setNovaAcao({ ...novaAcao, dataPrevista: e.target.value })}
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={novaAcao.risco}
                onChange={(e) => setNovaAcao({ ...novaAcao, risco: e.target.value })}
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sem risco</option>
                <option value="BAIXO">Risco Baixo</option>
                <option value="MEDIO">Risco Médio</option>
                <option value="ALTO">Risco Alto</option>
              </select>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Adicionar
              </button>
            </div>
          </form>
        )}

        {/* Lista checklist */}
        {acoesFiltradas.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            {filtro === 'TODAS' ? 'Nenhuma ação ainda. Clique em "+ Nova ação" para começar.' :
             filtro === 'PENDENTES' ? 'Nenhuma ação pendente.' :
             'Nenhuma ação concluída ainda.'}
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {acoesFiltradas.map((acao) => {
              const concluida = acao.status === 'CONCLUIDA'
              const atrasada = isAtrasada(acao)
              return (
                <li
                  key={acao.id}
                  className={`px-6 py-4 flex items-start gap-3 group transition-colors ${
                    atrasada ? 'bg-red-50' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggle(acao)}
                    disabled={toggling === acao.id}
                    className={`mt-0.5 w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-all ${
                      concluida
                        ? 'bg-green-500 border-green-500 text-white'
                        : atrasada
                        ? 'border-red-300 hover:border-red-400'
                        : 'border-gray-300 hover:border-blue-400'
                    } ${toggling === acao.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                  >
                    {concluida && (
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${concluida ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {acao.descricao}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {tipoLabels[acao.tipo] || acao.tipo}
                      </span>
                      {acao.responsavel && (
                        <span className="text-xs text-gray-400">👤 {acao.responsavel}</span>
                      )}
                      {acao.dataPrevista && !concluida && (
                        <span className={`text-xs ${atrasada ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                          {atrasada ? '⚠ Atrasado: ' : '📅 '}
                          {new Date(acao.dataPrevista).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {acao.dataConcluida && (
                        <span className="text-xs text-green-500">
                          ✓ {new Date(acao.dataConcluida).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {acao.risco && (
                        <span className={`text-xs font-medium ${riscoColors[acao.risco]}`}>
                          ● Risco {acao.risco === 'ALTO' ? 'alto' : acao.risco === 'MEDIO' ? 'médio' : 'baixo'}
                        </span>
                      )}
                    </div>
                    {acao.resultado && (
                      <p className="text-xs text-gray-500 mt-1.5 italic border-l-2 border-gray-200 pl-2">
                        {acao.resultado}
                      </p>
                    )}
                  </div>

                  {/* Excluir */}
                  <button
                    onClick={() => handleDeleteAcao(acao.id)}
                    className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-0.5"
                    title="Excluir ação"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {/* Rodapé */}
        {total > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl text-center">
            <p className="text-xs text-gray-400">
              {concluidas === total
                ? '✅ Todas as ações foram concluídas!'
                : `${total - concluidas} ação${total - concluidas !== 1 ? 'ões' : ''} pendente${total - concluidas !== 1 ? 's' : ''}`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
