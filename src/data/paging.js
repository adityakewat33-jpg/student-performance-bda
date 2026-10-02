export function extractPage(res) {
  let body = res;
  if (body && typeof body === 'object' && body.data && !Array.isArray(body.data)) {
    const inner = body.data;
    if (
      Array.isArray(inner.data) ||
      typeof inner.total !== 'undefined' ||
      typeof inner.totalPages !== 'undefined'
    ) {
      body = inner;
    }
  }
  const rows = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
  const total = typeof body?.total === 'number' ? body.total : rows.length;
  const totalPages = typeof body?.totalPages === 'number' ? body.totalPages : 1;
  const page = typeof body?.page === 'number' ? body.page : 1;
  return { rows, total, totalPages, page };
}
export function extractOne(res) {
  let body = res;
  if (body && typeof body === 'object' && body.data && !Array.isArray(body.data)) {
    body = body.data;
  }
  if (body && typeof body === 'object' && body.data && !Array.isArray(body.data)) {
    body = body.data;
  }
  return body;
}
export function extractList(res) {
  const body = res?.data ?? res;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.roles)) return body.roles;
  if (Array.isArray(body?.permissions)) return body.permissions;
  return [];
}
export function rowId(row) {
  if (!row) return '';
  return String(row.id ?? row._id ?? '');
}
export function rowTimestamp(row) {
  if (!row) return null;
  return row.created_at ?? row.createdAt ?? null;
}
export function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}