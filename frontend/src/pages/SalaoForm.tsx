import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'

export default function SalaoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    congregacao: '', codigoBRA: '', bairro: '', endereco: '',
    dataConstrucao: '', dataUltimaReforma: '', observacoes: '',
  })

  useEffect(() => {
    if (isEditing) {
      api.get(`/saloes/${id}`).then((res) => {
        const s = res.data
        setForm({
          congregacao: s.congregacao || '',
          codigoBRA: s.codigoBRA || '',
          bairro: s.bairro || '',
          endereco: s.endereco || '',
          dataConstrucao: s.dataConstrucao ? s.dataConstrucao.split('T')[0] : '',
          dataUltimaReforma: s.dataUltimaReforma ? s.dataUltimaReforma.split('T')[0] : '',
          observacoes: s.observacoes || '',
        })
      })
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        dataConstrucao: form.dataConstrucao || null,
        dataUltimaReforma: form.dataUltimaReforma || null,
      }
      if (isEditing) {
        await api.put(`/saloes/${id}`, payload)
      } else {
        await api.post('/saloes', payload)
      }
      navigate('/saloes')
    } catch (err: any) {
      setErro(err.response?.data?.error || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-5">{isEditing ? 'Editar Salão' : 'Novo Salão'}</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        {erro && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{erro}</div>}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Congregação *</label>
            <input type="text" value={form.congregacao} onChange={set('congregacao')} required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Código BRA *</label>
            <input type="text" value={form.codigoBRA} onChange={set('codigoBRA')} required placeholder="BRA-001"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Bairro</label>
            <input type="text" value={form.bairro} onChange={set('bairro')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Endereço</label>
            <input type="text" value={form.endereco} onChange={set('endereco')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Data de Construção</label>
            <input type="date" value={form.dataConstrucao} onChange={set('dataConstrucao')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Última Reforma</label>
            <input type="date" value={form.dataUltimaReforma} onChange={set('dataUltimaReforma')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
          <textarea value={form.observacoes} onChange={set('observacoes')} rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
          <button type="button" onClick={() => navigate('/saloes')}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 text-sm font-medium">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
