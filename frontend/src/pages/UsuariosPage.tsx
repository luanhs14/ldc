import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api, { apiErro } from '../services/api'
import { useAuth } from '../contexts/useAuth'
import PaginationControls from '../components/PaginationControls'
import { getListMeta, type ListMeta } from '../services/pagination'
import { toast } from 'sonner'
import { confirmDialog } from '../components/ConfirmModal'

interface Usuario {
  id: string
  nome: string
  usuario: string
  role: string
  criadoEm: string
}

const roleLabel: Record<string, string> = { ADMIN: 'Admin', OPERADOR: 'Operador' }

const empty = { nome: '', usuario: '', senha: '', role: 'OPERADOR' }

export default function UsuariosPage() {
  const qc = useQueryClient()
  const { user: me } = useAuth()
  const [form, setForm] = useState(empty)
  const [editando, setEditando] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('nome')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [meta, setMeta] = useState<ListMeta>({ page: 1, pageSize: 10, totalCount: 0, totalPages: 1, sortBy: 'nome', sortOrder: 'asc' })

  const toggleSort = (col: string) => {
    setPage(1)
    if (sortBy === col) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(col)
      setSortOrder('asc')
    }
  }

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return <span className="ml-1 text-gray-300">↕</span>
    return <span className="ml-1 text-blue-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
  }

  const { data: usuarios = [] } = useQuery<Usuario[]>({
    queryKey: ['usuarios', page, sortBy, sortOrder],
    queryFn: () =>
      api.get('/usuarios', { params: { page, pageSize: 10, sortBy, sortOrder } }).then((r) => {
        setMeta(getListMeta(r.headers))
        return r.data
      }),
  })

  const invalidar = () => qc.invalidateQueries({ queryKey: ['usuarios'] })

  const salvarMutation = useMutation({
    mutationFn: (payload: typeof form) =>
      editando ? api.put(`/usuarios/${editando}`, payload) : api.post('/usuarios', payload),
    onSuccess: () => { fechar(); invalidar(); toast.success('Usuário salvo') },
    onError: (err) => setErro(apiErro(err, 'Erro ao salvar')),
  })

  const excluirMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/usuarios/${id}`),
    onSuccess: () => { invalidar(); toast.success('Usuário excluído') },
    onError: (err) => { console.error(err); toast.error((err as any)?.response?.data?.error || 'Erro ao excluir usuário') },
  })

  const abrir = (u?: Usuario) => {
    setErro('')
    if (u) {
      setForm({ nome: u.nome, usuario: u.usuario, senha: '', role: u.role })
      setEditando(u.id)
    } else {
      setForm(empty)
      setEditando(null)
    }
    setShowForm(true)
  }

  const fechar = () => { setShowForm(false); setErro('') }

  const salvar = () => {
    setErro('')
    salvarMutation.mutate(form)
  }

  const excluir = async (id: string) => {
    if (!await confirmDialog('Excluir este usuário?')) return
    excluirMutation.mutate(id)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-900">Usuários</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => abrir()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Novo usuário
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer select-none hover:text-gray-900" onClick={() => toggleSort('nome')}>
                Nome<SortIcon col="nome" />
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer select-none hover:text-gray-900" onClick={() => toggleSort('usuario')}>
                Usuário<SortIcon col="usuario" />
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer select-none hover:text-gray-900" onClick={() => toggleSort('role')}>
                Perfil<SortIcon col="role" />
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.nome}</td>
                <td className="px-4 py-3 text-gray-500">{u.usuario}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    u.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {roleLabel[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => abrir(u)}
                    className="text-blue-600 hover:underline text-xs mr-3"
                  >
                    Editar
                  </button>
                  {u.id !== me?.id && (
                    <button
                      onClick={() => excluir(u.id)}
                      className="text-red-500 hover:underline text-xs"
                    >
                      Excluir
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationControls meta={meta} onPageChange={setPage} />

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editando ? 'Editar usuário' : 'Novo usuário'}
            </h2>

            {erro && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{erro}</div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuário (login)</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.usuario}
                  onChange={(e) => setForm({ ...form, usuario: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha {editando && <span className="text-gray-400 font-normal">(deixe em branco para manter)</span>}
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="OPERADOR">Operador</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={fechar}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvarMutation.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {salvarMutation.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
