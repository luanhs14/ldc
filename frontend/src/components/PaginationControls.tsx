import type { ListMeta } from '../services/pagination'

interface PaginationControlsProps {
  meta: ListMeta
  onPageChange: (page: number) => void
}

export default function PaginationControls({ meta, onPageChange }: PaginationControlsProps) {
  if (meta.totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between gap-3 pt-3">
      <p className="text-xs text-gray-500">
        {meta.totalCount} registro{meta.totalCount !== 1 ? 's' : ''} · página {meta.page} de {meta.totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Próxima
        </button>
      </div>
    </div>
  )
}
