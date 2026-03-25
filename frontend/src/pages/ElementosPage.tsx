import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api, { apiErro } from '../services/api'
import type { Elemento, ElementoTipo, Equipamento } from '../types'
import { CONDICAO_COLORS, CONDICAO_LABELS } from '../types'
import { toast } from 'sonner'
import { confirmDialog } from '../components/ConfirmModal'

const CONDICOES = ['OTIMO', 'BOM', 'REGULAR', 'RUIM', 'CRITICO']

export default function ElementosPage() {
  const { id: salaoId } = useParams()
  const qc = useQueryClient()
  const [expandido, setExpandido] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Elemento | null>(null)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    elementoTipoId: '', nomeCustomizado: '', dataInstalacao: '',
    condicaoAtual: 'BOM', vidaUtilAnos: '', proximaManutencao: '', observacoes: '',
  })

  const { data: elementos = [], isLoading } = useQuery<Elemento[]>({
    queryKey: ['elementos', salaoId],
    queryFn: () => api.get('/elementos', { params: { salaoId } }).then((r) => r.data),
  })

  const { data: tipos = [] } = useQuery<ElementoTipo[]>({
    queryKey: ['elementoTipos'],
    queryFn: () => api.get('/elementos/tipos').then((r) => r.data),
  })

  const { data: salao } = useQuery({
    queryKey: ['salao', salaoId],
    queryFn: () => api.get(`/saloes/${salaoId}`).then((r) => r.data),
  })

  const invalidar = () => qc.invalidateQueries({ queryKey: ['elementos', salaoId] })

  const salvarMutation = useMutation({
    mutationFn: (payload: any) =>
      editando ? api.put(`/elementos/${editando.id}`, payload) : api.post('/elementos', payload),
    onSuccess: () => { resetForm(); setShowForm(false); setEditando(null); invalidar(); toast.success('Elemento salvo') },
    onError: (err) => setErro(apiErro(err, 'Erro ao salvar elemento')),
  })

  const excluirMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/elementos/${id}`),
    onSuccess: () => { invalidar(); toast.success('Elemento excluído') },
    onError: (err) => setErro(apiErro(err, 'Erro ao excluir elemento')),
  })

  const resetForm = () => setForm({
    elementoTipoId: '', nomeCustomizado: '', dataInstalacao: '',
    condicaoAtual: 'BOM', vidaUtilAnos: '', proximaManutencao: '', observacoes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    salvarMutation.mutate({
      salaoId,
      elementoTipoId: form.elementoTipoId,
      nomeCustomizado: form.nomeCustomizado || null,
      dataInstalacao: form.dataInstalacao || null,
      condicaoAtual: form.condicaoAtual,
      vidaUtilAnos: form.vidaUtilAnos ? Number(form.vidaUtilAnos) : null,
      proximaManutencao: form.proximaManutencao || null,
      observacoes: form.observacoes || null,
    })
  }

  const handleEditar = (el: Elemento) => {
    setEditando(el)
    setForm({
      elementoTipoId: el.elementoTipoId,
      nomeCustomizado: el.nomeCustomizado || '',
      dataInstalacao: el.dataInstalacao ? el.dataInstalacao.split('T')[0] : '',
      condicaoAtual: el.condicaoAtual,
      vidaUtilAnos: el.vidaUtilAnos?.toString() || '',
      proximaManutencao: el.proximaManutencao ? el.proximaManutencao.split('T')[0] : '',
      observacoes: el.observacoes || '',
    })
    setShowForm(true)
  }

  const handleExcluir = async (id: string) => {
    if (!await confirmDialog('Excluir este elemento e todos os seus equipamentos?')) return
    excluirMutation.mutate(id)
  }

  const tipoSelecionado = tipos.find((t) => t.id === form.elementoTipoId)
  const vidaUtilDefault = tipoSelecionado?.vidaUtilPadraoAnos

  const calcVidaRestante = (el: Elemento) => {
    if (!el.dataInstalacao) return null
    const anos = el.vidaUtilAnos || el.elementoTipo?.vidaUtilPadraoAnos
    if (!anos) return null
    const instalado = new Date(el.dataInstalacao)
    const fim = new Date(instalado)
    fim.setFullYear(instalado.getFullYear() + anos)
    const hoje = new Date()
    const restanteMs = fim.getTime() - hoje.getTime()
    const restanteAnos = restanteMs / (1000 * 60 * 60 * 24 * 365)
    return Math.round(restanteAnos * 10) / 10
  }

  if (isLoading) return <div className="flex items-center justify-center py-24 text-gray-400 text-sm">Carregando...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex justify-between">
          {erro}<button onClick={() => setErro('')} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <Link to={`/saloes/${salaoId}`} className="hover:text-blue-500">← {salao?.congregacao}</Link>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Elementos do Prédio</h1>
        </div>
        <button
          onClick={() => { resetForm(); setEditando(null); setShowForm(!showForm) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          {showForm ? '✕ Cancelar' : '+ Novo Elemento'}
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">{editando ? 'Editar Elemento' : 'Adicionar Elemento'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo *</label>
              <select value={form.elementoTipoId} onChange={(e) => setForm((f) => ({ ...f, elementoTipoId: e.target.value }))}
                required disabled={!!editando}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50">
                <option value="">Selecione...</option>
                {tipos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>
            {tipoSelecionado?.codigo === 'OUTRO' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome personalizado</label>
                <input type="text" value={form.nomeCustomizado} onChange={(e) => setForm((f) => ({ ...f, nomeCustomizado: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Condição atual</label>
              <select value={form.condicaoAtual} onChange={(e) => setForm((f) => ({ ...f, condicaoAtual: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CONDICOES.map((c) => <option key={c} value={c}>{CONDICAO_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data de instalação</label>
              <input type="date" value={form.dataInstalacao} onChange={(e) => setForm((f) => ({ ...f, dataInstalacao: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Vida útil (anos){vidaUtilDefault ? ` — padrão: ${vidaUtilDefault}` : ''}
              </label>
              <input type="number" min="1" value={form.vidaUtilAnos} onChange={(e) => setForm((f) => ({ ...f, vidaUtilAnos: e.target.value }))}
                placeholder={vidaUtilDefault?.toString()}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Próxima manutenção</label>
              <input type="date" value={form.proximaManutencao} onChange={(e) => setForm((f) => ({ ...f, proximaManutencao: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
              <textarea value={form.observacoes} onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
                rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
              {editando ? 'Salvar alterações' : 'Adicionar'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditando(null); resetForm() }}
              className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-200 text-sm font-medium">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de elementos */}
      {elementos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-16 text-center text-gray-400 text-sm">
          Nenhum elemento cadastrado. Adicione os elementos do prédio para acompanhar o ciclo de vida.
        </div>
      ) : (
        <div className="space-y-2">
          {elementos.map((el) => {
            const vidaRestante = calcVidaRestante(el)
            const alertaVida = vidaRestante !== null && vidaRestante <= 2
            const isOpen = expandido === el.id

            return (
              <div key={el.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div
                  className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandido(isOpen ? null : el.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="font-medium text-gray-900 text-sm">
                      {el.elementoTipo?.nome}
                      {el.nomeCustomizado && <span className="text-gray-400 font-normal"> — {el.nomeCustomizado}</span>}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${CONDICAO_COLORS[el.condicaoAtual]}`}>
                      {CONDICAO_LABELS[el.condicaoAtual]}
                    </span>
                    {alertaVida && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium shrink-0">
                        ⚠ {vidaRestante! <= 0 ? 'Vida útil esgotada' : `${vidaRestante}a restante`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {el.dataInstalacao && (
                      <span className="text-xs text-gray-400 hidden sm:block">
                        Instalado: {new Date(el.dataInstalacao).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    <span className="text-gray-300 text-xs">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="px-5 pb-4 border-t border-gray-50 pt-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {el.dataInstalacao && (
                        <div>
                          <span className="text-gray-400">Instalação</span>
                          <p className="font-medium text-gray-700 mt-0.5">{new Date(el.dataInstalacao).toLocaleDateString('pt-BR')}</p>
                        </div>
                      )}
                      {(el.vidaUtilAnos || el.elementoTipo?.vidaUtilPadraoAnos) && (
                        <div>
                          <span className="text-gray-400">Vida útil</span>
                          <p className="font-medium text-gray-700 mt-0.5">{el.vidaUtilAnos || el.elementoTipo?.vidaUtilPadraoAnos} anos</p>
                        </div>
                      )}
                      {vidaRestante !== null && (
                        <div>
                          <span className="text-gray-400">Vida restante</span>
                          <p className={`font-medium mt-0.5 ${vidaRestante <= 0 ? 'text-red-600' : vidaRestante <= 2 ? 'text-amber-600' : 'text-gray-700'}`}>
                            {vidaRestante <= 0 ? 'Esgotada' : `${vidaRestante} anos`}
                          </p>
                        </div>
                      )}
                      {el.proximaManutencao && (
                        <div>
                          <span className="text-gray-400">Próx. manutenção</span>
                          <p className="font-medium text-gray-700 mt-0.5">{new Date(el.proximaManutencao).toLocaleDateString('pt-BR')}</p>
                        </div>
                      )}
                    </div>

                    {el.observacoes && (
                      <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{el.observacoes}</p>
                    )}

                    <EquipamentosSection elementoId={el.id} equipamentos={el.equipamentos || []} salaoId={salaoId!} />

                    <div className="flex gap-2 pt-1">
                      <button onClick={() => handleEditar(el)}
                        className="text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300">
                        Editar
                      </button>
                      <button onClick={() => handleExcluir(el.id)}
                        className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-100 hover:border-red-200">
                        Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EquipamentosSection({ elementoId, equipamentos, salaoId }: {
  elementoId: string; equipamentos: Equipamento[]; salaoId: string
}) {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nome: '', modelo: '', fabricante: '', dataInstalacao: '', garantiaAte: '', proximaManutencao: '', observacoes: '' })
  const [erro, setErro] = useState('')

  const invalidar = () => qc.invalidateQueries({ queryKey: ['elementos', salaoId] })

  const adicionarMutation = useMutation({
    mutationFn: (payload: any) => api.post('/equipamentos', payload),
    onSuccess: () => {
      setForm({ nome: '', modelo: '', fabricante: '', dataInstalacao: '', garantiaAte: '', proximaManutencao: '', observacoes: '' })
      setShowForm(false)
      invalidar()
      toast.success('Equipamento adicionado')
    },
    onError: (err) => setErro(apiErro(err, 'Erro ao adicionar equipamento')),
  })

  const excluirMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/equipamentos/${id}`),
    onSuccess: () => { invalidar(); toast.success('Equipamento excluído') },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    adicionarMutation.mutate({
      elementoId,
      nome: form.nome,
      modelo: form.modelo || null,
      fabricante: form.fabricante || null,
      dataInstalacao: form.dataInstalacao || null,
      garantiaAte: form.garantiaAte || null,
      proximaManutencao: form.proximaManutencao || null,
      observacoes: form.observacoes || null,
    })
  }

  const handleExcluir = async (id: string) => {
    if (!await confirmDialog('Excluir equipamento?')) return
    excluirMutation.mutate(id)
  }

  const garantiaVencida = (eq: Equipamento) =>
    eq.garantiaAte && new Date(eq.garantiaAte) < new Date()

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">Equipamentos ({equipamentos.length})</span>
        <button onClick={() => setShowForm(!showForm)}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium">
          {showForm ? '✕' : '+ Adicionar'}
        </button>
      </div>

      {erro && <p className="text-xs text-red-500 mb-2">{erro}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="Nome *" value={form.nome} required
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="text" placeholder="Modelo" value={form.modelo}
              onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))}
              className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="text" placeholder="Fabricante" value={form.fabricante}
              onChange={(e) => setForm((f) => ({ ...f, fabricante: e.target.value }))}
              className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="date" title="Data de instalação" value={form.dataInstalacao}
              onChange={(e) => setForm((f) => ({ ...f, dataInstalacao: e.target.value }))}
              className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div>
              <label className="text-xs text-gray-400 block mb-0.5">Garantia até</label>
              <input type="date" value={form.garantiaAte}
                onChange={(e) => setForm((f) => ({ ...f, garantiaAte: e.target.value }))}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-0.5">Próx. manutenção</label>
              <input type="date" value={form.proximaManutencao}
                onChange={(e) => setForm((f) => ({ ...f, proximaManutencao: e.target.value }))}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-blue-600 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-blue-700">
              Adicionar equipamento
            </button>
          </div>
        </form>
      )}

      {equipamentos.length > 0 && (
        <ul className="space-y-1.5">
          {equipamentos.map((eq) => (
            <li key={eq.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 group">
              <div>
                <span className="text-xs font-medium text-gray-700">{eq.nome}</span>
                {eq.modelo && <span className="text-xs text-gray-400 ml-2">{eq.modelo}</span>}
                {eq.fabricante && <span className="text-xs text-gray-400 ml-2">· {eq.fabricante}</span>}
                {eq.garantiaAte && (
                  <span className={`text-xs ml-2 ${garantiaVencida(eq) ? 'text-red-500' : 'text-gray-400'}`}>
                    · Garantia: {new Date(eq.garantiaAte).toLocaleDateString('pt-BR')}
                    {garantiaVencida(eq) && ' (vencida)'}
                  </span>
                )}
              </div>
              <button onClick={() => handleExcluir(eq.id)}
                className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
