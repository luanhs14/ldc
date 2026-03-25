import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api, { apiErro } from '../services/api'
import type { Avaliacao, Elemento } from '../types'
import { CONDICAO_LABELS, CONDICAO_COLORS } from '../types'
import { toast } from 'sonner'
import { confirmDialog } from '../components/ConfirmModal'

const CONDICOES = ['OTIMO', 'BOM', 'REGULAR', 'RUIM', 'CRITICO']

export default function AvaliacoesPage() {
  const { id: salaoId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    tipo: 'AMBOS', data: new Date().toISOString().split('T')[0], avaliador: '', observacoes: '',
  })

  const [avalElementos, setAvalElementos] = useState<Record<string, {
    condicao: string; previsaoSubstituicao: string; planejamentoReforma: string; observacoes: string
  }>>({})

  const [pendencias, setPendencias] = useState<Array<{
    descricao: string; prioridade: string; risco: string; responsavel: string; dataLimite: string; elementoId: string
  }>>([])
  const [novaPend, setNovaPend] = useState({
    descricao: '', prioridade: 'MEDIA', risco: '', responsavel: '', dataLimite: '', elementoId: '',
  })

  const { data: avaliacoes = [], isLoading } = useQuery<Avaliacao[]>({
    queryKey: ['avaliacoes', salaoId],
    queryFn: () => api.get('/avaliacoes', { params: { salaoId } }).then((r) => r.data),
  })

  const { data: elementos = [] } = useQuery<Elemento[]>({
    queryKey: ['elementos', salaoId],
    queryFn: () =>
      api.get('/elementos', { params: { salaoId } }).then((r) => {
        const init: typeof avalElementos = {}
        r.data.forEach((el: Elemento) => {
          init[el.id] = { condicao: el.condicaoAtual, previsaoSubstituicao: '', planejamentoReforma: '', observacoes: '' }
        })
        setAvalElementos(init)
        return r.data
      }),
  })

  const { data: salao } = useQuery({
    queryKey: ['salao', salaoId],
    queryFn: () => api.get(`/saloes/${salaoId}`).then((r) => r.data),
  })

  const invalidar = () => qc.invalidateQueries({ queryKey: ['avaliacoes', salaoId] })

  const criarMutation = useMutation({
    mutationFn: async () => {
      const includeDC97 = form.tipo === 'DC97' || form.tipo === 'AMBOS'
      const includeDC96 = form.tipo === 'DC96' || form.tipo === 'AMBOS'

      const elementosPayload = includeDC97
        ? elementos.map((el) => ({
            elementoId: el.id,
            condicao: avalElementos[el.id]?.condicao || el.condicaoAtual,
            previsaoSubstituicao: avalElementos[el.id]?.previsaoSubstituicao || null,
            planejamentoReforma: avalElementos[el.id]?.planejamentoReforma || null,
            observacoes: avalElementos[el.id]?.observacoes || null,
          }))
        : []

      const avRes = await api.post('/avaliacoes', {
        salaoId, tipo: form.tipo, data: form.data, avaliador: form.avaliador, observacoes: form.observacoes || null,
        elementos: elementosPayload,
      })

      if (includeDC96) {
        for (const p of pendencias) {
          await api.post('/pendencias', {
            salaoId, avaliacaoId: avRes.data.id,
            descricao: p.descricao, prioridade: p.prioridade, risco: p.risco || null,
            responsavel: p.responsavel || null, dataLimite: p.dataLimite || null, elementoId: p.elementoId || null,
          })
        }
      }
    },
    onSuccess: () => {
      setShowForm(false)
      setPendencias([])
      setForm({ tipo: 'AMBOS', data: new Date().toISOString().split('T')[0], avaliador: '', observacoes: '' })
      invalidar()
      toast.success('Avaliação salva')
    },
    onError: (err) => setErro(apiErro(err, 'Erro ao salvar avaliação')),
  })

  const excluirMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/avaliacoes/${id}`),
    onSuccess: () => { invalidar(); toast.success('Avaliação excluída') },
    onError: (err) => setErro(apiErro(err, 'Erro ao excluir avaliação')),
  })

  const handleAddPend = () => {
    if (!novaPend.descricao.trim()) return
    setPendencias((p) => [...p, { ...novaPend }])
    setNovaPend({ descricao: '', prioridade: 'MEDIA', risco: '', responsavel: '', dataLimite: '', elementoId: '' })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    criarMutation.mutate()
  }

  const handleExcluir = async (id: string) => {
    if (!await confirmDialog('Excluir esta avaliação?')) return
    excluirMutation.mutate(id)
  }

  const showDC96 = form.tipo === 'DC96' || form.tipo === 'AMBOS'
  const showDC97 = form.tipo === 'DC97' || form.tipo === 'AMBOS'

  if (isLoading) return <div className="flex items-center justify-center py-24 text-gray-400 text-sm">Carregando...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex justify-between">
          {erro}<button onClick={() => setErro('')} className="text-red-400">✕</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-400 mb-1">
            <button onClick={() => navigate(`/saloes/${salaoId}`)} className="hover:text-blue-500">← {salao?.congregacao}</button>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Avaliações DC-96 / DC-97</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
          {showForm ? '✕ Cancelar' : '+ Nova Avaliação'}
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">
          {/* Dados gerais */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Dados gerais</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Formulário *</label>
                <select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))} required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="AMBOS">DC-96 + DC-97 (Ambos)</option>
                  <option value="DC96">DC-96 (Pendências)</option>
                  <option value="DC97">DC-97 (Ciclo de vida)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Data *</label>
                <input type="date" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Avaliador *</label>
                <input type="text" value={form.avaliador} onChange={(e) => setForm((f) => ({ ...f, avaliador: e.target.value }))} required
                  placeholder="Nome do avaliador"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2 sm:col-span-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Observações gerais</label>
                <textarea value={form.observacoes} onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
                  rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
          </div>

          {/* DC-97: Avaliação de elementos */}
          {showDC97 && elementos.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-1">DC-97 — Ciclo de vida dos elementos</h2>
              <p className="text-xs text-gray-400 mb-3">Avalie a condição atual de cada elemento do prédio.</p>
              <div className="space-y-2">
                {elementos.map((el) => (
                  <div key={el.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-gray-700">{el.elementoTipo?.nome}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONDICAO_COLORS[el.condicaoAtual]}`}>
                        Atual: {CONDICAO_LABELS[el.condicaoAtual]}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs text-gray-400 mb-0.5">Nova condição</label>
                        <select
                          value={avalElementos[el.id]?.condicao || el.condicaoAtual}
                          onChange={(e) => setAvalElementos((prev) => ({ ...prev, [el.id]: { ...prev[el.id], condicao: e.target.value } }))}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                          {CONDICOES.map((c) => <option key={c} value={c}>{CONDICAO_LABELS[c]}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-0.5">Prev. substituição</label>
                        <input type="date"
                          value={avalElementos[el.id]?.previsaoSubstituicao || ''}
                          onChange={(e) => setAvalElementos((prev) => ({ ...prev, [el.id]: { ...prev[el.id], previsaoSubstituicao: e.target.value } }))}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-0.5">Planej. reforma</label>
                        <input type="text" placeholder="Ex: 2026"
                          value={avalElementos[el.id]?.planejamentoReforma || ''}
                          onChange={(e) => setAvalElementos((prev) => ({ ...prev, [el.id]: { ...prev[el.id], planejamentoReforma: e.target.value } }))}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-0.5">Observação</label>
                        <input type="text"
                          value={avalElementos[el.id]?.observacoes || ''}
                          onChange={(e) => setAvalElementos((prev) => ({ ...prev, [el.id]: { ...prev[el.id], observacoes: e.target.value } }))}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {elementos.length === 0 && (
                <p className="text-xs text-gray-400">Cadastre os elementos do prédio antes de realizar o DC-97.</p>
              )}
            </div>
          )}

          {/* DC-96: Pendências */}
          {showDC96 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-1">DC-96 — Lista de pendências</h2>
              <p className="text-xs text-gray-400 mb-3">Registre os problemas e reparos identificados.</p>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 mb-3">
                <textarea value={novaPend.descricao}
                  onChange={(e) => setNovaPend((f) => ({ ...f, descricao: e.target.value }))}
                  placeholder="Descreva o problema ou reparo necessário..."
                  rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <select value={novaPend.prioridade}
                    onChange={(e) => setNovaPend((f) => ({ ...f, prioridade: e.target.value }))}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="BAIXA">Prioridade Baixa</option>
                    <option value="MEDIA">Prioridade Média</option>
                    <option value="ALTA">Prioridade Alta</option>
                  </select>
                  <select value={novaPend.risco}
                    onChange={(e) => setNovaPend((f) => ({ ...f, risco: e.target.value }))}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Sem risco</option>
                    <option value="BAIXO">Risco baixo</option>
                    <option value="MEDIO">Risco médio</option>
                    <option value="ALTO">Risco alto</option>
                  </select>
                  <select value={novaPend.elementoId}
                    onChange={(e) => setNovaPend((f) => ({ ...f, elementoId: e.target.value }))}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Elemento</option>
                    {elementos.map((el) => <option key={el.id} value={el.id}>{el.elementoTipo?.nome}</option>)}
                  </select>
                  <input type="text" placeholder="Responsável" value={novaPend.responsavel}
                    onChange={(e) => setNovaPend((f) => ({ ...f, responsavel: e.target.value }))}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="date" title="Data limite" value={novaPend.dataLimite}
                    onChange={(e) => setNovaPend((f) => ({ ...f, dataLimite: e.target.value }))}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={handleAddPend}
                    className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 font-medium">
                    + Adicionar
                  </button>
                </div>
              </div>
              {pendencias.length > 0 && (
                <ul className="space-y-1.5">
                  {pendencias.map((p, i) => (
                    <li key={i} className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">{p.descricao}</p>
                        <div className="flex gap-2 mt-0.5">
                          <span className="text-xs text-amber-700">{p.prioridade}</span>
                          {p.risco && <span className="text-xs text-red-600">· Risco {p.risco.toLowerCase()}</span>}
                          {p.responsavel && <span className="text-xs text-gray-400">· {p.responsavel}</span>}
                        </div>
                      </div>
                      <button type="button" onClick={() => setPendencias((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-gray-300 hover:text-red-400 shrink-0">✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
              Salvar avaliação
            </button>
            <button type="button" onClick={() => { setShowForm(false); setPendencias([]) }}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 text-sm font-medium">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de avaliações */}
      {avaliacoes.length === 0 && !showForm ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-16 text-center text-gray-400 text-sm">
          Nenhuma avaliação registrada. Realize uma avaliação DC-96 ou DC-97.
        </div>
      ) : (
        <div className="space-y-2">
          {avaliacoes.map((av) => (
            <div key={av.id} className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">{av.tipo}</span>
                  <span className="text-xs text-gray-400">{new Date(av.data).toLocaleDateString('pt-BR')}</span>
                  <span className="text-xs text-gray-500">· {av.avaliador}</span>
                </div>
                <div className="flex gap-3 mt-1 text-xs text-gray-400">
                  {av._count?.pendencias ? <span>{av._count.pendencias} pendência(s)</span> : null}
                  {av._count?.elementos ? <span>· {av._count.elementos} elemento(s) avaliado(s)</span> : null}
                </div>
              </div>
              <button onClick={() => handleExcluir(av.id)}
                className="text-xs text-red-400 hover:text-red-600 px-3 py-1.5 rounded-lg border border-red-100 hover:border-red-200">
                Excluir
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
