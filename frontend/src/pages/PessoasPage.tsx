import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import type { Pessoa, Salao } from '../types'
import { FUNCAO_LABELS, ESPECIALIDADE_LABELS } from '../types'

const FUNCOES = Object.keys(FUNCAO_LABELS)
const ESPECIALIDADES = Object.keys(ESPECIALIDADE_LABELS)

export default function PessoasPage() {
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [saloes, setSaloes] = useState<Salao[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Pessoa | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    nome: '', telefone: '', email: '',
    autorizadoAltoRisco: false, observacoesAutorizacao: '', funcoes: [] as string[], salaoIds: [] as string[], especialidades: [] as string[],
  })

  const fetchTudo = async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        api.get('/pessoas'),
        api.get('/saloes'),
      ])
      setPessoas(pRes.data)
      setSaloes(sRes.data)
    } catch { setErro('Erro ao carregar dados') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTudo() }, [])

  const resetForm = () => setForm({
    nome: '', telefone: '', email: '',
    autorizadoAltoRisco: false, observacoesAutorizacao: '', funcoes: [], salaoIds: [], especialidades: [],
  })

  const handleEditar = (p: Pessoa) => {
    setEditando(p)
    setForm({
      nome: p.nome, telefone: p.telefone || '', email: p.email || '',
      autorizadoAltoRisco: p.autorizadoAltoRisco,
      observacoesAutorizacao: p.observacoesAutorizacao || '',
      funcoes: p.funcoes.map((f) => f.funcao),
      salaoIds: p.saloes?.map((s) => s.salaoId) || [],
      especialidades: p.especialidades ? p.especialidades.split(',') : [],
    })
    setShowForm(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const toggleEspecialidade = (e: string) => {
    setForm((prev) => ({
      ...prev,
      especialidades: prev.especialidades.includes(e) ? prev.especialidades.filter((x) => x !== e) : [...prev.especialidades, e],
    }))
  }

  const toggleSalao = (id: string) => {
    setForm((prev) => ({
      ...prev,
      salaoIds: prev.salaoIds.includes(id) ? prev.salaoIds.filter((x) => x !== id) : [...prev.salaoIds, id],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        telefone: form.telefone || null,
        email: form.email || null,
        observacoesAutorizacao: form.observacoesAutorizacao || null,
        salaoIds: form.salaoIds,
      }
      if (editando) {
        await api.put(`/pessoas/${editando.id}`, payload)
      } else {
        await api.post('/pessoas', payload)
      }
      resetForm()
      setShowForm(false)
      setEditando(null)
      fetchTudo()
    } catch (err: any) {
      setErro(err.response?.data?.error || 'Erro ao salvar pessoa')
    }
  }

  const handleExcluir = async (id: string) => {
    if (!confirm('Excluir esta pessoa?')) return
    try { await api.delete(`/pessoas/${id}`); fetchTudo() }
    catch { setErro('Erro ao excluir pessoa') }
  }

  const toggleFuncao = (f: string) => {
    setForm((prev) => ({
      ...prev,
      funcoes: prev.funcoes.includes(f) ? prev.funcoes.filter((x) => x !== f) : [...prev.funcoes, f],
    }))
  }

  if (loading) return <div className="flex items-center justify-center py-24 text-gray-400 text-sm">Carregando...</div>

  const gruposComPessoas = FUNCOES.filter((funcao) =>
    pessoas.some((p) => p.funcoes.some((f) => f.funcao === funcao))
  )
  const semFuncao = pessoas.filter((p) => p.funcoes.length === 0)

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex justify-between">
          {erro}<button onClick={() => setErro('')} className="text-red-400">x</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Pessoas</h1>
        <button onClick={() => { resetForm(); setEditando(null); setShowForm(!showForm) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
          {showForm ? 'Cancelar' : '+ Nova Pessoa'}
        </button>
      </div>

      {showForm && (
        <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">{editando ? 'Editar pessoa' : 'Nova pessoa'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
              <input type="text" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
              <input type="text" value={form.telefone} onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {saloes.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Salao(es) / BRA</label>
              <div className="flex flex-wrap gap-2">
                {saloes.map((s) => (
                  <button key={s.id} type="button" onClick={() => toggleSalao(s.id)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
                      form.salaoIds.includes(s.id)
                        ? 'bg-green-600 text-white border-green-600'
                        : 'text-gray-600 border-gray-200 hover:border-green-300'
                    }`}>
                    {s.codigoBRA} — {s.congregacao}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Especialidades</label>
            <div className="flex flex-wrap gap-2">
              {ESPECIALIDADES.map((e) => (
                <button key={e} type="button" onClick={() => toggleEspecialidade(e)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
                    form.especialidades.includes(e)
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'text-gray-600 border-gray-200 hover:border-purple-300'
                  }`}>
                  {ESPECIALIDADE_LABELS[e]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Funcoes</label>
            <div className="flex flex-wrap gap-2">
              {FUNCOES.map((f) => (
                <button key={f} type="button" onClick={() => toggleFuncao(f)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
                    form.funcoes.includes(f)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}>
                  {FUNCAO_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.autorizadoAltoRisco}
                onChange={(e) => setForm((f) => ({ ...f, autorizadoAltoRisco: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">Autorizado para servicos de alto risco</span>
            </label>
            {form.autorizadoAltoRisco && (
              <input type="text" placeholder="Observacoes sobre a autorizacao (NR-35, NR-10...)"
                value={form.observacoesAutorizacao}
                onChange={(e) => setForm((f) => ({ ...f, observacoesAutorizacao: e.target.value }))}
                className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            )}
          </div>

          <div className="flex gap-3">
            <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
              {editando ? 'Salvar alteracoes' : 'Cadastrar'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditando(null); resetForm() }}
              className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-200 text-sm font-medium">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {pessoas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-16 text-center text-gray-400 text-sm">
          Nenhuma pessoa cadastrada.
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {[...gruposComPessoas, ...(semFuncao.length > 0 ? ['_sem_funcao'] : [])].map((funcao) => {
            const isSemFuncao = funcao === '_sem_funcao'
            const grupo = isSemFuncao ? semFuncao : pessoas.filter((p) => p.funcoes.some((f) => f.funcao === funcao))
            const titulo = isSemFuncao ? 'Sem funcao' : FUNCAO_LABELS[funcao]
            return (
              <div key={funcao} className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-4 py-2.5 border-b border-gray-50 flex items-center justify-between">
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{titulo}</h2>
                  <span className="text-xs text-gray-400">{grupo.length}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {grupo.map((p) => {
                    const outrasFuncoes = isSemFuncao ? [] : p.funcoes.filter((f) => f.funcao !== funcao)
                    return (
                      <div key={p.id} className="px-4 py-3 group hover:bg-gray-50">
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 leading-tight">{p.nome}</p>
                            {p.telefone && (
                              <p className="text-xs text-gray-400 mt-0.5">{p.telefone}</p>
                            )}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {p.saloes?.map((s) => (
                                <span key={s.id} className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                                  {s.salao.codigoBRA}
                                </span>
                              ))}
                              {p.autorizadoAltoRisco && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Alto risco</span>
                              )}
                              {p.especialidades?.split(',').filter(Boolean).map((e) => (
                                <span key={e} className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                                  {ESPECIALIDADE_LABELS[e] || e}
                                </span>
                              ))}
                              {outrasFuncoes.map((f) => (
                                <span key={f.id} className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                                  {FUNCAO_LABELS[f.funcao] || f.funcao}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditar(p)}
                              className="text-xs text-gray-500 hover:text-gray-900 px-2 py-1 rounded border border-gray-200">
                              Editar
                            </button>
                            <button onClick={() => handleExcluir(p.id)}
                              className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded border border-red-100">
                              Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
