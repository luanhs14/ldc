import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api, { apiErro } from '../services/api'
import type { Salao } from '../types'
import PaginationControls from '../components/PaginationControls'
import { getListMeta, type ListMeta } from '../services/pagination'
import { toast } from 'sonner'
import { confirmDialog } from '../components/ConfirmModal'

interface OrcamentoAnual {
  id: string; salaoId: string; ano: number
  orcamentoPrevisto: number; saldoReserva: number; observacoes?: string
  _count: { lancamentos: number }
}
interface Lancamento {
  id: string; descricao: string; valor: number; data: string; categoria: string
  elemento?: { elementoTipo: { nome: string } }
  pendencia?: { id: string; descricao: string }
}

const CATEGORIAS: Record<string, string> = {
  MATERIAL: 'Material', MAO_DE_OBRA: 'Mão de obra',
  SERVICO_TERCEIRO: 'Serviço terceirizado', OUTRO: 'Outro',
}

const ANO_ATUAL = new Date().getFullYear()

export default function FinanceiroPage() {
  const qc = useQueryClient()
  const [erro, setErro] = useState('')
  const [pageOrc, setPageOrc] = useState(1)
  const [pageLanc, setPageLanc] = useState(1)
  const [metaOrc, setMetaOrc] = useState<ListMeta>({ page: 1, pageSize: 10, totalCount: 0, totalPages: 1, sortBy: 'ano', sortOrder: 'desc' })
  const [metaLanc, setMetaLanc] = useState<ListMeta>({ page: 1, pageSize: 10, totalCount: 0, totalPages: 1, sortBy: 'data', sortOrder: 'desc' })

  const [filtroSalaoId, setFiltroSalaoId] = useState('')
  const [filtroAno, setFiltroAno] = useState(ANO_ATUAL)

  const [showFormOrc, setShowFormOrc] = useState(false)
  const [showFormLanc, setShowFormLanc] = useState(false)

  const [formOrc, setFormOrc] = useState({ salaoId: '', ano: ANO_ATUAL, orcamentoPrevisto: '', saldoReserva: '', observacoes: '' })
  const [formLanc, setFormLanc] = useState({
    salaoId: '', descricao: '', valor: '', data: new Date().toISOString().split('T')[0], categoria: 'MATERIAL',
  })

  const { data: saloes = [] } = useQuery<Salao[]>({
    queryKey: ['saloes'],
    queryFn: () => api.get('/saloes').then((r) => r.data),
  })

  const { data: orcamentos = [], isLoading } = useQuery<OrcamentoAnual[]>({
    queryKey: ['orcamentos', filtroSalaoId, filtroAno, pageOrc],
    queryFn: () =>
      api.get('/financeiro/orcamentos', {
        params: { salaoId: filtroSalaoId || undefined, ano: filtroAno, page: pageOrc, pageSize: 10, sortBy: 'ano', sortOrder: 'desc' },
      }).then((r) => {
        setMetaOrc(getListMeta(r.headers))
        return r.data
      }),
  })

  const { data: lancData } = useQuery<{ lancamentos: Lancamento[]; total: number }>({
    queryKey: ['lancamentos', filtroSalaoId, filtroAno, pageLanc],
    queryFn: () =>
      api.get('/financeiro/lancamentos', {
        params: { salaoId: filtroSalaoId || undefined, ano: filtroAno, page: pageLanc, pageSize: 10, sortBy: 'data', sortOrder: 'desc' },
      }).then((r) => {
        setMetaLanc(getListMeta(r.headers))
        return r.data
      }),
  })

  const lancamentos = lancData?.lancamentos ?? []
  const totalGasto = lancData?.total ?? 0

  const invalidarOrc = () => qc.invalidateQueries({ queryKey: ['orcamentos'] })
  const invalidarLanc = () => qc.invalidateQueries({ queryKey: ['lancamentos'] })

  const salvarOrcMutation = useMutation({
    mutationFn: (payload: any) => api.post('/financeiro/orcamentos', payload),
    onSuccess: () => {
      setShowFormOrc(false)
      setFormOrc({ salaoId: '', ano: ANO_ATUAL, orcamentoPrevisto: '', saldoReserva: '', observacoes: '' })
      invalidarOrc()
      toast.success('Orçamento salvo')
    },
    onError: (err) => setErro(apiErro(err, 'Erro ao salvar orçamento')),
  })

  const salvarLancMutation = useMutation({
    mutationFn: (payload: any) => api.post('/financeiro/lancamentos', payload),
    onSuccess: () => {
      setShowFormLanc(false)
      setFormLanc({ salaoId: '', descricao: '', valor: '', data: new Date().toISOString().split('T')[0], categoria: 'MATERIAL' })
      invalidarLanc()
      toast.success('Lançamento registrado')
    },
    onError: (err) => setErro(apiErro(err, 'Erro ao registrar lançamento')),
  })

  const excluirLancMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/financeiro/lancamentos/${id}`),
    onSuccess: () => { invalidarLanc(); toast.success('Lançamento excluído') },
    onError: (err) => setErro(apiErro(err, 'Erro ao excluir lançamento')),
  })

  const orcamentoSelecionado = orcamentos.find((o) => o.salaoId === filtroSalaoId) || orcamentos[0]
  const saldoDisponivel = orcamentoSelecionado
    ? orcamentoSelecionado.orcamentoPrevisto + orcamentoSelecionado.saldoReserva - totalGasto
    : null

  const handleSubmitOrc = (e: React.FormEvent) => {
    e.preventDefault()
    salvarOrcMutation.mutate({
      salaoId: formOrc.salaoId, ano: Number(formOrc.ano),
      orcamentoPrevisto: Number(formOrc.orcamentoPrevisto),
      saldoReserva: Number(formOrc.saldoReserva || 0),
      observacoes: formOrc.observacoes || null,
    })
  }

  const handleSubmitLanc = (e: React.FormEvent) => {
    e.preventDefault()
    salvarLancMutation.mutate({
      salaoId: formLanc.salaoId || filtroSalaoId,
      orcamentoAnualId: orcamentoSelecionado?.id || null,
      descricao: formLanc.descricao,
      valor: Number(formLanc.valor),
      data: formLanc.data,
      categoria: formLanc.categoria,
    })
  }

  const handleExcluirLanc = async (id: string) => {
    if (!await confirmDialog('Excluir lançamento?')) return
    excluirLancMutation.mutate(id)
  }

  if (isLoading) return <div className="flex items-center justify-center py-24 text-gray-400 text-sm">Carregando...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex justify-between">
          {erro}<button onClick={() => setErro('')} className="text-red-400">✕</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Financeiro</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowFormOrc(!showFormOrc)}
            className="text-sm text-gray-600 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg font-medium">
            {showFormOrc ? '✕' : '+ Orçamento'}
          </button>
          <button onClick={() => setShowFormLanc(!showFormLanc)}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 text-sm font-medium">
            {showFormLanc ? '✕' : '+ Lançamento'}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 flex gap-3 flex-wrap">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Salão</label>
          <select value={filtroSalaoId} onChange={(e) => { setPageOrc(1); setPageLanc(1); setFiltroSalaoId(e.target.value) }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos</option>
            {saloes.map((s) => <option key={s.id} value={s.id}>{s.codigoBRA} — {s.congregacao}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Ano</label>
          <select value={filtroAno} onChange={(e) => { setPageOrc(1); setPageLanc(1); setFiltroAno(Number(e.target.value)) }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {[ANO_ATUAL, ANO_ATUAL - 1, ANO_ATUAL - 2].map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* Formulário orçamento */}
      {showFormOrc && (
        <form onSubmit={handleSubmitOrc} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Novo orçamento anual</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Salão *</label>
              <select value={formOrc.salaoId} onChange={(e) => setFormOrc((f) => ({ ...f, salaoId: e.target.value }))} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Selecione...</option>
                {saloes.map((s) => <option key={s.id} value={s.id}>{s.codigoBRA} — {s.congregacao}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ano *</label>
              <input type="number" value={formOrc.ano} onChange={(e) => setFormOrc((f) => ({ ...f, ano: Number(e.target.value) }))} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Orçamento previsto *</label>
              <input type="number" step="0.01" value={formOrc.orcamentoPrevisto}
                onChange={(e) => setFormOrc((f) => ({ ...f, orcamentoPrevisto: e.target.value }))} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Saldo reserva</label>
              <input type="number" step="0.01" value={formOrc.saldoReserva}
                onChange={(e) => setFormOrc((f) => ({ ...f, saldoReserva: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
            Salvar orçamento
          </button>
        </form>
      )}

      {/* Formulário lançamento */}
      {showFormLanc && (
        <form onSubmit={handleSubmitLanc} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Novo lançamento de custo</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {!filtroSalaoId && (
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Salão *</label>
                <select value={formLanc.salaoId} onChange={(e) => setFormLanc((f) => ({ ...f, salaoId: e.target.value }))} required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Selecione...</option>
                  {saloes.map((s) => <option key={s.id} value={s.id}>{s.codigoBRA} — {s.congregacao}</option>)}
                </select>
              </div>
            )}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Descrição *</label>
              <input type="text" value={formLanc.descricao} onChange={(e) => setFormLanc((f) => ({ ...f, descricao: e.target.value }))} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Valor (R$) *</label>
              <input type="number" step="0.01" value={formLanc.valor}
                onChange={(e) => setFormLanc((f) => ({ ...f, valor: e.target.value }))} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data *</label>
              <input type="date" value={formLanc.data} onChange={(e) => setFormLanc((f) => ({ ...f, data: e.target.value }))} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categoria *</label>
              <select value={formLanc.categoria} onChange={(e) => setFormLanc((f) => ({ ...f, categoria: e.target.value }))} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {Object.entries(CATEGORIAS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
            Registrar lançamento
          </button>
        </form>
      )}

      {/* Resumo do orçamento */}
      {orcamentoSelecionado && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-xs text-gray-500 mb-1">Orçamento previsto</div>
            <div className="text-lg font-bold text-gray-900">
              R$ {orcamentoSelecionado.orcamentoPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-xs text-gray-500 mb-1">Saldo reserva</div>
            <div className="text-lg font-bold text-blue-600">
              R$ {orcamentoSelecionado.saldoReserva.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-xs text-gray-500 mb-1">Total gasto</div>
            <div className="text-lg font-bold text-red-500">
              R$ {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className={`rounded-xl shadow-sm border p-4 ${saldoDisponivel! < 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
            <div className="text-xs text-gray-500 mb-1">Saldo disponível</div>
            <div className={`text-lg font-bold ${saldoDisponivel! < 0 ? 'text-red-600' : 'text-green-600'}`}>
              R$ {saldoDisponivel!.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      )}
      <PaginationControls meta={metaOrc} onPageChange={setPageOrc} />

      {/* Lançamentos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Lançamentos {filtroAno}</h2>
        </div>
        {lancamentos.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400 text-sm">Nenhum lançamento no período.</div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {lancamentos.map((l) => (
              <li key={l.id} className="px-5 py-3 flex items-center justify-between group hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">{l.descricao}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{CATEGORIAS[l.categoria]}</span>
                    {l.elemento && (
                      <span className="text-xs text-gray-400">{l.elemento.elementoTipo.nome}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(l.data).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">
                    R$ {l.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <button onClick={() => handleExcluirLanc(l.id)}
                    className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">✕</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <PaginationControls meta={metaLanc} onPageChange={setPageLanc} />
    </div>
  )
}
