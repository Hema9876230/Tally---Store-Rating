import { useEffect, useMemo, useState } from 'react';
import { api } from './api.js';

// Server-side filtering + sorting for a list endpoint (debounced).
export function useListing(path, defaultSort) {
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState(defaultSort);
  const [order, setOrder] = useState('asc');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    setLoading(true);
    const t = setTimeout(() => {
      api(path, { params: { ...filters, sort, order } })
        .then((d) => { if (live) { setRows(d); setError(''); } })
        .catch((e) => live && setError(e.message))
        .finally(() => live && setLoading(false));
    }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [path, filters, sort, order, tick]);

  const onSort = (key) => {
    if (key === sort) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSort(key); setOrder('asc'); }
  };
  return { rows, setRows, loading, error, filters, setFilters, sort, order, onSort, reload: () => setTick((n) => n + 1) };
}

// In-memory sorting for data that is already on the page.
export function useLocalSort(rows, defaultSort, defaultOrder = 'desc') {
  const [sort, setSort] = useState(defaultSort);
  const [order, setOrder] = useState(defaultOrder);
  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const x = a[sort], y = b[sort];
        const c = typeof x === 'number' ? x - y : String(x).localeCompare(String(y));
        return order === 'asc' ? c : -c;
      }),
    [rows, sort, order]
  );
  const onSort = (key) => {
    if (key === sort) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSort(key); setOrder('asc'); }
  };
  return { rows: sorted, sort, order, onSort };
}
