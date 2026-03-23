import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import type { Congregacao, Elemento } from '../types'
import { VISITA_TIPO_LABELS } from '../types'

export default function VisitaForm() {
  const { id: salaoId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [congregacoes, setCongregacoes] = useState<Congregacao[]>([])
  const [elementos, setElementos] = useState<Elemento[]>([])
  const [salaoNome, setSalaoNome] = useState('')

  const [form, setForm] = useState({
    tipo: 'MANUTENCAO', data: new Date().toISOString().split('T')[0],
    visitanteNome: '', congregacaoId: '', relatorio: '',
  })

  const [pendencias, setPendencias] = useState<Array<{
    descricao: string; prioridade: string; risco: string; responsavel: string; dataLimite: string; elementoId: string
  }>>([])

  const [novaPendencia, setNovaPendencia] = useState({
    descricao: '', prioridade: 'MEDIA', risco: '', responsavel: '', dataLimite: '', elementoId: '',
  })

  useEffect(() => {
    Promise.all([
      api.get('/congregacoes', { params: { salaoId } }),
      api.get('/elementos', { params: { salaoId } }),
      api.get(`/saloes/${salaoId}`),
    ]).then(([cRes, elRes, sRes]) => {
      setCongregacoes(cRes.data)
      setElementos(elRes.data)
      setSalaoNome(sRes.data.congregacao)
    })
  }, [salaoId])

  const handleAddPendencia = () => {
    if (!novaPendencia.descricao.trim()) return
    setPendencias((prev) => [...prev, { ...novaPendencia }])
    setNovaPendencia({ descricao: '', prioridade: 'MEDIA', risco: '', responsavel: '', dataLimite: '', elementoId: '' })
  }

  const handleRemovePendencia = (i: number) =>
    setPendencias((prev) => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const visitaRes = await api.post('/visitas', {
        salaoId,
        tipo: form.tipo,
        data: form.data,
        visitanteNome: form.visitanteNome || null,
        congregacaoId: form.congregacaoId || null,
        relatorio: form.relatorio || null,
      })
      const visitaId = visitaRes.data.id

      // Criar pendências vinculadas à visita
      for (const p of pendencias) {
        await api.post('/pendencias', {
          salaoId,
          visitaId,
          descricao: p.descricao,
          prioridade: p.prioridade,
          risco: p.risco || null,
          responsavel: p.responsavel || null,
          dataLimite: p.dataLimite || null,
          elementoId: p.elementoId || null,
        })
      }

      navigate(`/visitas/${visitaId}`)
    } catch (err: any) {
      setErro(err.response?.data?.error || 'Erro ao registrar visita')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <div className="text-sm text-gray-400 mb-1">
          <button onClick={() => navigate(`/saloes/${salaoId}`)} className="hover:text-blue-500">← {salaoNome}</button>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Registrar Visita</h1>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{erro}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dados da visita */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Dados da visita</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo *</label>
              <select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {Object.entries(VISITA_TIPO_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data *</label>
              <input type="date" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Visitante / Responsável</label>
              <input type="text" value={form.visitanteNome} onChange={(e) => setForm((f) => ({ ...f, visitanteNome: e.target.value }))}
                placeholder="Nome do visitante"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Congregação</label>
              <select value={form.congregacaoId} onChange={(e) => setForm((f) => ({ ...f, congregacaoId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Selecione...</option>
                {congregacoes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Relatório / Observações</label>
            <textarea value={form.relatorio} onChange={(e) => setForm((f) => ({ ...f, relatorio: e.target.value }))}
              rows={4} placeholder="Descreva o que foi observado, realizado ou encaminhado..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>

        {/* Pendências identificadas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Pendências identificadas na visita</h2>

          {/* Adicionar pendência */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <textarea value={novaPendencia.descricao}
              onChange={(e) => setNovaPendencia((f) => ({ ...f, descricao: e.target.value }))}
              placeholder="Descreva o problema ou pendência encontrada..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
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
              <input type="date" title="Data limite"
                value={novaPendencia.dataLimite}
                onChange={(e) => setNovaPendencia((f) => ({ ...f, dataLimite: e.target.value }))}
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={handleAddPendencia}
                className="bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700">
                + Adicionar
              </button>
            </div>
          </div>

          {/* Lista de pendências adicionadas */}
          {pendencias.length > 0 && (
            <ul className="space-y-2">
              {pendencias.map((p, i) => (
                <li key={i} className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{p.descricao}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-xs text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">{p.prioridade}</span>
                      {p.risco && <span className="text-xs text-red-600">Risco {p.risco.toLowerCase()}</span>}
                      {p.responsavel && <span className="text-xs text-gray-400">👤 {p.responsavel}</span>}
                      {p.dataLimite && <span className="text-xs text-gray-400">📅 {new Date(p.dataLimite).toLocaleDateString('pt-BR')}</span>}
                    </div>
                  </div>
                  <button type="button" onClick={() => handleRemovePendencia(i)}
                    className="text-gray-300 hover:text-red-400 shrink-0">✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
            {loading ? 'Salvando...' : 'Registrar visita'}
          </button>
          <button type="button" onClick={() => navigate(`/saloes/${salaoId}`)}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 text-sm font-medium">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
