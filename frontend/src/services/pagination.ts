import type { AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios'

export interface ListMeta {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export function getListMeta(headers: RawAxiosResponseHeaders | AxiosResponseHeaders): ListMeta {
  return {
    page: parseNumber(headers['x-page'], 1),
    pageSize: parseNumber(headers['x-page-size'], 100),
    totalCount: parseNumber(headers['x-total-count'], 0),
    totalPages: parseNumber(headers['x-total-pages'], 1),
    sortBy: String(headers['x-sort-by'] || ''),
    sortOrder: headers['x-sort-order'] === 'desc' ? 'desc' : 'asc',
  }
}

function parseNumber(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}
