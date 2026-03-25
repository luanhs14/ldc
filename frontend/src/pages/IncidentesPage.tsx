import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api, { apiErro } from '../services/api'
import type { Incidente } from '../types'
import { toast } from 'sonner'
import { confirmDialog } from '../components/ConfirmModal'

const TIPOS = ['LESAO', 'QUASE_ACIDENTE', 'SITUACAO_PERIGOSA']
const TIPO_LABELS: Record<string, string> = {
  LESAO: 'Lesão', QUASE_ACIDENTE: 'Quase acidente', SITUACAO_PERIGOSA: 'Situação perigosa',
}
const GRAVIDADE_COLORS: Record<string, string> = {
  BAIXA: 'bg-green-100 text-green-700', MEDIA: 'bg-amber-100 text-amber-700', ALTA: 'bg-red-100 text-red-700',
}

const FORM_INICIAL = {
  data: new Date().toISOString().split('T')[0],
  local: '', tipo: 'SITUACAO_PERIGOSA', descricao: '', gravidade: 'MEDIA', acaoCorretiva: '',
}

export default function IncidentesPage() {
  const { id: salaoId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState(FORM_INICIAL)

  const { data: incidentes = [], isLoading: loadingInc } = useQuery({
    queryKey: ['incidentes', { salaoId }],
    queryFn: () => api.get('/incidentes', { params: { salaoId } }).then((r) => r.data as Incidente[]),
    enabled: !!salaoId,
  })

  const { data: salao } = useQuery({
    queryKey: ['salao', salaoId],
    queryFn: () => api.get(`/saloes/${salaoId}`).then((r) => r.data),
    enabled: !!salaoId,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['incidentes', { salaoId }] })

  const criarMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/incidentes', { salaoId, ...data, acaoCorretiva: data.acaoCorretiva || null }),
    onSuccess: () => { setForm(FORM_INICIAL); setShowForm(false); invalidate(); toast.success('Incidente registrado') },
    onError: (err) => setErro(apiErro(err, 'Erro ao registrar incidente')),
  })

  const resolverMutation = useMutation({
    mutationFn: (inc: Incidente) => api.put(`/incidentes/${inc.id}`, {
      status: inc.status === 'RESOLVIDO' ? 'ABERTO' : 'RESOLVIDO',
    }),
    onSuccess: invalidate,
    onError: (err) => setErro(apiErro(err, 'Erro ao atualizar incidente')),
  })

  const excluirMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/incidentes/${id}`),
    onSuccess: () => { invalidate(); toast.success('Incidente excluído') },
    onError: (err) => setErro(apiErro(err, 'Erro ao excluir incidente')),
  })

  const handleExcluir = async (id: string) => {
    if (!await confirmDialog('Excluir este incidente?')) return
    excluirMutation.mutate(id)
  }

  if (loadingInc) return <div className="flex items-center justify-center py-24 text-gray-400 text-sm">Carregando...</div>

  const abertos = incidentes.filter((i) => i.status === 'ABERTO').length

  return (
    <div className="max-w-3xl mx-auto space-y-5">
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
          <h1 className="text-xl font-bold text-gray-900">Incidentes</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium transition-colors">
          {showForm ? '✕ Cancelar' : '+ Registrar Incidente'}
        </button>
      </div>

      {abertos > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-3 flex items-center gap-3">
          <span className="text-red-600 text-lg">⚠</span>
          <p className="text-sm text-red-700 font-medium">
            {abertos} incidente{abertos !== 1 ? 's' : ''} em aberto — ação corretiva necessária
          </p>
        </div>
      )}

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); criarMutation.mutate(form) }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Novo incidente / ocorrência</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo *</label>
              <select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {TIPOS.map((t) => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Gravidade *</label>
              <select value={form.gravidade} onChange={(e) => setForm((f) => ({ ...f, gravidade: e.target.value }))} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data *</label>
              <input type="date" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Local *</label>
              <input type="text" value={form.local} onChange={(e) => setForm((f) => ({ ...f, local: e.target.value }))} required
                placeholder="Ex: cobertura ala norte"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Descrição *</label>
              <textarea value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} required
                rows={3} placeholder="Descreva o que aconteceu..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Ação corretiva</label>
              <textarea value={form.acaoCorretiva} onChange={(e) => setForm((f) => ({ ...f, acaoCorretiva: e.target.value }))}
                rows={2} placeholder="Medidas tomadas ou planejadas..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={criarMutation.isPending}
              className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50">
              Registrar
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-200 text-sm font-medium">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {incidentes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-16 text-center text-gray-400 text-sm">
          Nenhum incidente registrado.
        </div>
      ) : (
        <div className="space-y-2">
          {incidentes.map((inc) => (
            <div key={inc.id} className={`bg-white rounded-xl shadow-sm border px-5 py-4 ${inc.status === 'ABERTO' ? 'border-red-100' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{TIPO_LABELS[inc.tipo]}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${GRAVIDADE_COLORS[inc.gravidade]}`}>
                      {inc.gravidade}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      inc.status === 'ABERTO' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {inc.status === 'ABERTO' ? 'Aberto' : 'Resolvido'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(inc.data).toLocaleDateString('pt-BR')} · {inc.local}
                  </p>
                  <p className="text-sm text-gray-700 mt-2">{inc.descricao}</p>
                  {inc.acaoCorretiva && (
                    <p className="text-xs text-gray-500 mt-1.5 border-l-2 border-gray-200 pl-2">
                      Ação: {inc.acaoCorretiva}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={() => resolverMutation.mutate(inc)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                      inc.status === 'ABERTO'
                        ? 'border-green-200 text-green-600 hover:bg-green-50'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}>
                    {inc.status === 'ABERTO' ? '✓ Resolver' : 'Reabrir'}
                  </button>
                  <button onClick={() => handleExcluir(inc.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-400 hover:border-red-200 hover:text-red-600 transition-colors">
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
