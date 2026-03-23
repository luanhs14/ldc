import { Response } from 'express';

type SortOrder = 'asc' | 'desc';

interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

interface SortParams<TField extends string> {
  sortBy: TField;
  sortOrder: SortOrder;
}

export function parsePagination(query: Record<string, unknown>, defaults?: { pageSize?: number; maxPageSize?: number }): PaginationParams {
  const maxPageSize = defaults?.maxPageSize ?? 100;
  const defaultPageSize = defaults?.pageSize ?? 20;
  const hasExplicitPagination = query.page !== undefined || query.pageSize !== undefined;

  const page = normalizePositiveInt(query.page, 1);
  const requestedPageSize = normalizePositiveInt(query.pageSize, hasExplicitPagination ? defaultPageSize : maxPageSize);
  const pageSize = Math.min(requestedPageSize, maxPageSize);

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function parseSort<TField extends string>(
  query: Record<string, unknown>,
  allowedFields: readonly TField[],
  defaultField: TField,
  defaultOrder: SortOrder = 'asc'
): SortParams<TField> {
  const requestedField = String(query.sortBy || '');
  const sortBy = allowedFields.includes(requestedField as TField) ? (requestedField as TField) : defaultField;

  const requestedOrder = String(query.sortOrder || '').toLowerCase();
  const sortOrder: SortOrder = requestedOrder === 'desc' ? 'desc' : requestedOrder === 'asc' ? 'asc' : defaultOrder;

  return { sortBy, sortOrder };
}

export function applyListHeaders(
  res: Response,
  params: PaginationParams & SortParams<string> & { total: number }
) {
  const totalPages = Math.max(1, Math.ceil(params.total / params.pageSize));

  res.setHeader('X-Page', String(params.page));
  res.setHeader('X-Page-Size', String(params.pageSize));
  res.setHeader('X-Total-Count', String(params.total));
  res.setHeader('X-Total-Pages', String(totalPages));
  res.setHeader('X-Sort-By', params.sortBy);
  res.setHeader('X-Sort-Order', params.sortOrder);
}

function normalizePositiveInt(value: unknown, fallback: number) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
