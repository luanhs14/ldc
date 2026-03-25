import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api, { apiErro } from '../services/api'
import type { Salao, Pendencia, Visita, Elemento } from '../types'
import { CONDICAO_COLORS, CONDICAO_LABELS, PRIORIDADE_COLORS, VISITA_TIPO_LABELS } from '../types'
import { toast } from 'sonner'
import { confirmDialog } from '../components/ConfirmModal'

type Aba = 'pendencias' | 'elementos' | 'visitas' | 'historico'

export default function SalaoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [aba, setAba] = useState<Aba>('pendencias')
  const [toggling, setToggling] = useState<string | null>(null)
  const [showFormPendencia, setShowFormPendencia] = useState(false)
  const [erro, setErro] = useState('')

  const [novaPendencia, setNovaPendencia] = useState({
    descricao: '', prioridade: 'MEDIA', risco: '', responsavel: '', dataLimite: '', elementoId: '',
  })

  const [editandoPendencia, setEditandoPendencia] = useState<string | null>(null)
  const [editPendenciaForm, setEditPendenciaForm] = useState({
    descricao: '', prioridade: 'MEDIA', risco: '', responsavel: '', dataLimite: '', elementoId: '',
  })

  const [editandoVisita, setEditandoVisita] = useState<string | null>(null)
  const [editVisitaForm, setEditVisitaForm] = useState({
    tipo: '', data: '', visitanteNome: '', relatorio: '',
  })

  const { data: salao, isLoading: loadingSalao } = useQuery<Salao>({
    queryKey: ['salao', id],
    queryFn: () => api.get(`/saloes/${id}`).then((r) => r.data),
  })

  const { data: pendencias = [], isLoading: loadingPend } = useQuery<Pendencia[]>({
    queryKey: ['pendencias', id],
    queryFn: () => api.get('/pendencias', { params: { salaoId: id } }).then((r) => r.data),
  })

  const { data: visitas = [], isLoading: loadingVisitas } = useQuery<Visita[]>({
    queryKey: ['visitas', id],
    queryFn: () => api.get('/visitas', { params: { salaoId: id } }).then((r) => r.data),
  })

  const isLoading = loadingSalao || loadingPend || loadingVisitas

  const invalidarTudo = () => {
    qc.invalidateQueries({ queryKey: ['salao', id] })
    qc.invalidateQueries({ queryKey: ['pendencias', id] })
    qc.invalidateQueries({ queryKey: ['visitas', id] })
  }

  const toggleMutation = useMutation({
    mutationFn: ({ pendId, novoStatus }: { pendId: string; novoStatus: string }) =>
      api.put(`/pendencias/${pendId}`, { status: novoStatus }),
    onMutate: ({ pendId }) => setToggling(pendId),
    onSettled: () => setToggling(null),
    onSuccess: invalidarTudo,
    onError: (err) => setErro(apiErro(err, 'Erro ao atualizar pendência')),
  })

  const addPendenciaMutation = useMutation({
    mutationFn: (payload: any) => api.post('/pendencias', payload),
    onSuccess: () => {
      setShowFormPendencia(false)
      setNovaPendencia({ descricao: '', prioridade: 'MEDIA', risco: '', responsavel: '', dataLimite: '', elementoId: '' })
      invalidarTudo()
      toast.success('Pendência criada')
    },
    onError: (err) => setErro(apiErro(err, 'Erro ao criar pendência')),
  })

  const deletePendenciaMutation = useMutation({
    mutationFn: (pendId: string) => api.delete(`/pendencias/${pendId}`),
    onSuccess: () => { invalidarTudo(); toast.success('Pendência excluída') },
    onError: (err) => setErro(apiErro(err, 'Erro ao excluir pendência')),
  })

  const editPendenciaMutation = useMutation({
    mutationFn: ({ pendId, payload }: { pendId: string; payload: any }) =>
      api.put(`/pendencias/${pendId}`, payload),
    onSuccess: () => { setEditandoPendencia(null); invalidarTudo(); toast.success('Pendência atualizada') },
    onError: (err) => setErro(apiErro(err, 'Erro ao salvar pendência')),
  })

  const deleteSalaoMutation = useMutation({
    mutationFn: () => api.delete(`/saloes/${id}`),
    onSuccess: () => navigate('/saloes'),
    onError: (err) => setErro(apiErro(err, 'Erro ao excluir salão')),
  })

  const editVisitaMutation = useMutation({
    mutationFn: ({ visitaId, payload }: { visitaId: string; payload: any }) =>
      api.put(`/visitas/${visitaId}`, payload),
    onSuccess: () => { setEditandoVisita(null); invalidarTudo(); toast.success('Visita atualizada') },
    onError: (err) => setErro(apiErro(err, 'Erro ao salvar visita')),
  })

  const deleteVisitaMutation = useMutation({
    mutationFn: (visitaId: string) => api.delete(`/visitas/${visitaId}`),
    onSuccess: () => { invalidarTudo(); toast.success('Visita excluída') },
    onError: (err) => setErro(apiErro(err, 'Erro ao excluir visita')),
  })

  const pendentesAtivas = pendencias.filter((p) => p.status !== 'CONCLUIDO' && p.status !== 'CANCELADO')
  const pendentesTotal = pendencias.length
  const concluidasTotal = pendencias.filter((p) => p.status === 'CONCLUIDO').length
  const progresso = pendentesTotal > 0 ? Math.round((concluidasTotal / pendentesTotal) * 100) : 0

  const handleTogglePendencia = (p: Pendencia) => {
    const novoStatus = p.status === 'CONCLUIDO' ? 'PENDENTE' : 'CONCLUIDO'
    toggleMutation.mutate({ pendId: p.id, novoStatus })
  }

  const handleAddPendencia = (e: React.FormEvent) => {
    e.preventDefault()
    addPendenciaMutation.mutate({
      salaoId: id,
      ...novaPendencia,
      risco: novaPendencia.risco || null,
      dataLimite: novaPendencia.dataLimite || null,
      elementoId: novaPendencia.elementoId || null,
    })
  }

  const handleIniciarEditPendencia = (p: Pendencia) => {
    setEditandoPendencia(p.id)
    setEditPendenciaForm({
      descricao: p.descricao,
      prioridade: p.prioridade,
      risco: p.risco || '',
      responsavel: p.responsavel || '',
      dataLimite: p.dataLimite ? p.dataLimite.substring(0, 10) : '',
      elementoId: p.elementoId || '',
    })
  }

  const handleSalvarEditPendencia = (pendId: string) => {
    editPendenciaMutation.mutate({
      pendId,
      payload: {
        ...editPendenciaForm,
        risco: editPendenciaForm.risco || null,
        dataLimite: editPendenciaForm.dataLimite || null,
        elementoId: editPendenciaForm.elementoId || null,
      },
    })
  }

  const handleIniciarEditVisita = (v: Visita) => {
    setEditandoVisita(v.id)
    setEditVisitaForm({
      tipo: v.tipo,
      data: v.data.substring(0, 10),
      visitanteNome: v.visitanteNome || '',
      relatorio: v.relatorio || '',
    })
  }

  const handleSalvarEditVisita = (visitaId: string) => {
    editVisitaMutation.mutate({
      visitaId,
      payload: {
        ...editVisitaForm,
        visitanteNome: editVisitaForm.visitanteNome || null,
        relatorio: editVisitaForm.relatorio || null,
      },
    })
  }

  const isAtrasada = (p: Pendencia) =>
    p.status !== 'CONCLUIDO' && !!p.dataLimite && new Date(p.dataLimite) < new Date()

  if (isLoading) return <div className="flex items-center justify-center py-24 text-gray-400 text-sm">Carregando...</div>
  if (!salao) return <div className="flex items-center justify-center py-24 text-red-500 text-sm">Salão não encontrado</div>

  const elementos: Elemento[] = salao.elementos || []

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex justify-between">
          {erro}
          <button onClick={() => setErro('')} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Header do salão */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{salao.congregacao}</h1>
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">{salao.codigoBRA}</span>
            </div>
            <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
              {salao.bairro && <><span>·</span><span>{salao.bairro}</span></>}{salao.endereco && <><span>·</span><span>{salao.endereco}</span></>}
              {salao.dataUltimaReforma && (
                <><span>·</span><span>Reforma: {new Date(salao.dataUltimaReforma).toLocaleDateString('pt-BR')}</span></>
              )}
            </div>
            {salao.congregacoes && salao.congregacoes.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Congregações: {salao.congregacoes.map((c) => c.nome).join(', ')}
              </p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Link to={`/saloes/${id}/editar`} className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
              Editar
            </Link>
            <button onClick={async () => { if (await confirmDialog('Excluir este salão e todos os seus dados?')) deleteSalaoMutation.mutate() }}
              className="text-sm text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-100 hover:border-red-200 transition-colors">
              Excluir
            </button>
          </div>
        </div>

        {/* Progresso das pendências */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-500">Pendências</span>
            <span className="text-xs font-semibold text-gray-600">{concluidasTotal}/{pendentesTotal} resolvidas · {progresso}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progresso === 100 ? 'bg-green-500' : progresso > 50 ? 'bg-blue-400' : 'bg-amber-400'}`}
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>

        {/* Links rápidos */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <Link to={`/saloes/${id}/visitas/nova`} className="text-xs text-blue-600 hover:text-blue-700 border border-blue-100 hover:border-blue-200 px-3 py-1.5 rounded-lg font-medium transition-colors">
            + Registrar Visita
          </Link>
          <Link to={`/saloes/${id}/avaliacoes`} className="text-xs text-gray-600 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg font-medium transition-colors">
            Avaliações DC-96/97
          </Link>
          <Link to={`/saloes/${id}/incidentes`} className="text-xs text-gray-600 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg font-medium transition-colors">
            Incidentes
          </Link>
        </div>
      </div>

      {/* Abas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-100 px-4 gap-1 overflow-x-auto">
          {([
            { key: 'pendencias', label: `Checklist (${pendentesAtivas.length})` },
            { key: 'elementos', label: `Elementos (${elementos.length})` },
            { key: 'visitas', label: `Visitas (${visitas.length})` },
            { key: 'historico', label: 'Histórico' },
          ] as { key: Aba; label: string }[]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setAba(tab.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                aba === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ABA: Checklist de Pendências */}
        {aba === 'pendencias' && (
          <div>
            <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">{pendentesAtivas.length} pendências em aberto</span>
              <button onClick={() => setShowFormPendencia(!showFormPendencia)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700">
                {showFormPendencia ? '✕ Cancelar' : '+ Nova'}
              </button>
            </div>

            {showFormPendencia && (
              <form onSubmit={handleAddPendencia} className="px-5 py-4 border-b border-gray-100 bg-gray-50 space-y-3">
                <textarea
                  value={novaPendencia.descricao}
                  onChange={(e) => setNovaPendencia((f) => ({ ...f, descricao: e.target.value }))}
                  placeholder="Descreva a pendência..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2} required autoFocus
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <select value={novaPendencia.prioridade}
                    onChange={(e) => setNovaPendencia((f) => ({ ...f, prioridade: e.target.value }))}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="BAIXA">Prioridade Baixa</option>
                    <option value="MEDIA">Prioridade Média</option>
                    <option value="ALTA">Prioridade Alta</option>
                  </select>
                  <select value={novaPendencia.risco}
                    onChange={(e) => setNovaPendencia((f) => ({ ...f, risco: e.target.value }))}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Sem risco</option>
                    <option value="BAIXO">Risco baixo</option>
                    <option value="MEDIO">Risco médio</option>
                    <option value="ALTO">Risco alto</option>
                  </select>
                  <select value={novaPendencia.elementoId}
                    onChange={(e) => setNovaPendencia((f) => ({ ...f, elementoId: e.target.value }))}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Elemento (opcional)</option>
                    {elementos.map((el) => (
                      <option key={el.id} value={el.id}>{el.elementoTipo?.nome || el.nomeCustomizado}</option>
                    ))}
                  </select>
                  <input type="text" placeholder="Responsável"
                    value={novaPendencia.responsavel}
                    onChange={(e) => setNovaPendencia((f) => ({ ...f, responsavel: e.target.value }))}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="date"
                    value={novaPendencia.dataLimite}
                    onChange={(e) => setNovaPendencia((f) => ({ ...f, dataLimite: e.target.value }))}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="submit" className="bg-blue-600 text-white text-xs font-medium px-4 py-1.5 rounded-lg hover:bg-blue-700">
                    Adicionar
                  </button>
                </div>
              </form>
            )}

            {pendencias.length === 0 ? (
              <div className="px-5 py-12 text-center text-gray-400 text-sm">
                Nenhuma pendência. Clique em "+ Nova" para começar.
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {pendencias.map((p) => {
                  const concluida = p.status === 'CONCLUIDO'
                  const atrasada = isAtrasada(p)
                  return (
                    <li key={p.id} className={`px-5 py-4 transition-colors ${editandoPendencia === p.id ? 'bg-blue-50' : atrasada ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                      {editandoPendencia === p.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editPendenciaForm.descricao}
                            onChange={(e) => setEditPendenciaForm((f) => ({ ...f, descricao: e.target.value }))}
                            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={2} autoFocus
                          />
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <select value={editPendenciaForm.prioridade}
                              onChange={(e) => setEditPendenciaForm((f) => ({ ...f, prioridade: e.target.value }))}
                              className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="BAIXA">Prioridade Baixa</option>
                              <option value="MEDIA">Prioridade Média</option>
                              <option value="ALTA">Prioridade Alta</option>
                            </select>
                            <select value={editPendenciaForm.risco}
                              onChange={(e) => setEditPendenciaForm((f) => ({ ...f, risco: e.target.value }))}
                              className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="">Sem risco</option>
                              <option value="BAIXO">Risco baixo</option>
                              <option value="MEDIO">Risco médio</option>
                              <option value="ALTO">Risco alto</option>
                            </select>
                            <select value={editPendenciaForm.elementoId}
                              onChange={(e) => setEditPendenciaForm((f) => ({ ...f, elementoId: e.target.value }))}
                              className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="">Elemento (opcional)</option>
                              {elementos.map((el) => (
                                <option key={el.id} value={el.id}>{el.elementoTipo?.nome || el.nomeCustomizado}</option>
                              ))}
                            </select>
                            <input type="text" placeholder="Responsável"
                              value={editPendenciaForm.responsavel}
                              onChange={(e) => setEditPendenciaForm((f) => ({ ...f, responsavel: e.target.value }))}
                              className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <input type="date"
                              value={editPendenciaForm.dataLimite}
                              onChange={(e) => setEditPendenciaForm((f) => ({ ...f, dataLimite: e.target.value }))}
                              className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleSalvarEditPendencia(p.id)}
                              className="bg-blue-600 text-white text-xs font-medium px-4 py-1.5 rounded-lg hover:bg-blue-700">
                              Salvar
                            </button>
                            <button onClick={() => setEditandoPendencia(null)}
                              className="bg-gray-100 text-gray-600 text-xs font-medium px-4 py-1.5 rounded-lg hover:bg-gray-200">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3 group">
                          <button
                            onClick={() => handleTogglePendencia(p)}
                            disabled={toggling === p.id || p.status === 'CANCELADO'}
                            className={`mt-0.5 w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-all ${
                              concluida ? 'bg-green-500 border-green-500 text-white' :
                              atrasada ? 'border-red-300 hover:border-red-400' :
                              'border-gray-300 hover:border-blue-400'
                            } ${toggling === p.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
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
                                  {atrasada ? '⚠ ' : ''}{new Date(p.dataLimite).toLocaleDateString('pt-BR')}
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
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-0.5">
                            <button onClick={() => handleIniciarEditPendencia(p)}
                              className="text-xs text-gray-500 hover:text-blue-600 px-2 py-1 rounded border border-gray-200 hover:border-blue-300">
                              Editar
                            </button>
                            <button onClick={async () => { if (await confirmDialog('Excluir esta pendência?')) deletePendenciaMutation.mutate(p.id) }}
                              className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded border border-gray-200 hover:border-red-200">
                              Excluir
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}

            {pendencias.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-50 bg-gray-50 rounded-b-xl text-center">
                <p className="text-xs text-gray-400">
                  {pendentesAtivas.length === 0 ? '✅ Todas as pendências resolvidas!' : `${pendentesAtivas.length} em aberto`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ABA: Elementos */}
        {aba === 'elementos' && (
          <div>
            <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">{elementos.length} elemento{elementos.length !== 1 ? 's' : ''} cadastrado{elementos.length !== 1 ? 's' : ''}</span>
              <Link to={`/saloes/${id}/elementos`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                Gerenciar →
              </Link>
            </div>
            {elementos.length === 0 ? (
              <div className="px-5 py-12 text-center text-gray-400 text-sm">
                Nenhum elemento cadastrado.{' '}
                <Link to={`/saloes/${id}/elementos`} className="text-blue-500 hover:underline">Cadastrar elementos</Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {elementos.map((el) => (
                  <li key={el.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <span className="text-sm font-medium text-gray-800">
                        {el.elementoTipo?.nome}
                        {el.nomeCustomizado && <span className="text-gray-400 font-normal"> — {el.nomeCustomizado}</span>}
                      </span>
                      <div className="flex gap-2 mt-0.5">
                        {el.dataInstalacao && (
                          <span className="text-xs text-gray-400">
                            Instalado: {new Date(el.dataInstalacao).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        {el.equipamentos && el.equipamentos.length > 0 && (
                          <span className="text-xs text-gray-400">· {el.equipamentos.length} equipamento{el.equipamentos.length !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONDICAO_COLORS[el.condicaoAtual]}`}>
                      {CONDICAO_LABELS[el.condicaoAtual]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ABA: Visitas */}
        {aba === 'visitas' && (
          <div>
            <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">{visitas.length} visita{visitas.length !== 1 ? 's' : ''}</span>
              <Link to={`/saloes/${id}/visitas/nova`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                + Registrar Visita
              </Link>
            </div>
            {visitas.length === 0 ? (
              <div className="px-5 py-12 text-center text-gray-400 text-sm">Nenhuma visita registrada.</div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {visitas.map((v) => (
                  <li key={v.id} className={`transition-colors ${editandoVisita === v.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                    {editandoVisita === v.id ? (
                      <div className="px-5 py-4 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <select value={editVisitaForm.tipo}
                            onChange={(e) => setEditVisitaForm((f) => ({ ...f, tipo: e.target.value }))}
                            className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {Object.entries(VISITA_TIPO_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                          <input type="date" value={editVisitaForm.data}
                            onChange={(e) => setEditVisitaForm((f) => ({ ...f, data: e.target.value }))}
                            className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          <input type="text" placeholder="Nome do visitante"
                            value={editVisitaForm.visitanteNome}
                            onChange={(e) => setEditVisitaForm((f) => ({ ...f, visitanteNome: e.target.value }))}
                            className="col-span-2 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          <textarea placeholder="Relatório (opcional)"
                            value={editVisitaForm.relatorio}
                            onChange={(e) => setEditVisitaForm((f) => ({ ...f, relatorio: e.target.value }))}
                            className="col-span-2 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={2} />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleSalvarEditVisita(v.id)}
                            className="bg-blue-600 text-white text-xs font-medium px-4 py-1.5 rounded-lg hover:bg-blue-700">
                            Salvar
                          </button>
                          <button onClick={() => setEditandoVisita(null)}
                            className="bg-gray-100 text-gray-600 text-xs font-medium px-4 py-1.5 rounded-lg hover:bg-gray-200">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="px-5 py-3 flex items-center justify-between group">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800">
                              {VISITA_TIPO_LABELS[v.tipo] || v.tipo}
                            </span>
                            {v._count && v._count.pendencias > 0 && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                                {v._count.pendencias} pendência{v._count.pendencias !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(v.data).toLocaleDateString('pt-BR')}
                            {v.visitanteNome && ` · ${v.visitanteNome}`}
                            {v.congregacao && ` · ${v.congregacao.nome}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => handleIniciarEditVisita(v)}
                              className="text-xs text-gray-500 hover:text-blue-600 px-2 py-1 rounded border border-gray-200 hover:border-blue-300">
                              Editar
                            </button>
                            <button onClick={async () => { if (await confirmDialog('Excluir esta visita?')) deleteVisitaMutation.mutate(v.id) }}
                              className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded border border-gray-200 hover:border-red-200">
                              Excluir
                            </button>
                          </div>
                          <Link to={`/visitas/${v.id}`} className="text-xs text-blue-500 hover:text-blue-700">Ver →</Link>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ABA: Histórico */}
        {aba === 'historico' && <HistoricoTab salaoId={id!} />}
      </div>
    </div>
  )
}

function HistoricoTab({ salaoId }: { salaoId: string }) {
  const { data: eventos = [], isLoading } = useQuery<any[]>({
    queryKey: ['historico', salaoId],
    queryFn: () => api.get(`/saloes/${salaoId}/historico`).then((r) => r.data),
  })

  const tipoIcon: Record<string, string> = {
    VISITA: '🏠', AVALIACAO: '📋', PENDENCIA_CONCLUIDA: '✅', INCIDENTE: '⚠',
  }
  const tipoLabel: Record<string, string> = {
    VISITA: 'Visita', AVALIACAO: 'Avaliação', PENDENCIA_CONCLUIDA: 'Pendência resolvida', INCIDENTE: 'Incidente',
  }

  if (isLoading) return <div className="px-5 py-12 text-center text-gray-400 text-sm">Carregando histórico...</div>
  if (eventos.length === 0) return <div className="px-5 py-12 text-center text-gray-400 text-sm">Nenhum evento registrado.</div>

  const porAno = eventos.reduce((acc: Record<string, any[]>, ev) => {
    const ano = new Date(ev.data).getFullYear().toString()
    if (!acc[ano]) acc[ano] = []
    acc[ano].push(ev)
    return acc
  }, {})

  return (
    <div className="px-5 py-4 space-y-6">
      {Object.entries(porAno).sort(([a], [b]) => Number(b) - Number(a)).map(([ano, evs]) => (
        <div key={ano}>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{ano}</h3>
          <div className="space-y-2">
            {evs.map((ev, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-lg shrink-0">{tipoIcon[ev.tipo] || '·'}</span>
                <div>
                  <span className="text-sm text-gray-700 font-medium">{tipoLabel[ev.tipo] || ev.tipo}</span>
                  {ev.subtipo && <span className="text-xs text-gray-400 ml-2">({ev.subtipo})</span>}
                  {ev.descricao && <p className="text-xs text-gray-500 mt-0.5">{ev.descricao}</p>}
                  <p className="text-xs text-gray-400">{new Date(ev.data).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
