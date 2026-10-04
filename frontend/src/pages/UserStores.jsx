import { useState } from 'react';
import { api } from '../api.js';
import { useListing } from '../hooks.js';
import DataTable from '../components/DataTable.jsx';
import { Alert, FilterBar, PageHead } from '../components/ui.jsx';
import { StarInput, StarRow } from '../components/Stars.jsx';

export default function UserStores() {
  const L = useListing('/stores', 'name');
  const [saving, setSaving] = useState(null);
  const [status, setStatus] = useState({ kind: 'ok', text: '' });

  async function rate(store, n) {
    setSaving(store.id);
    try {
      const r = await api(`/stores/${store.id}/rating`, { method: 'PUT', body: { rating: n } });
      L.setRows((rows) => rows.map((x) => (x.id === store.id ? { ...x, ...r } : x)));
      setStatus({ kind: 'ok', text: `${store.my_rating ? 'Updated' : 'Saved'} your rating for ${store.name}: ${n} of 5.` });
    } catch (e) {
      setStatus({ kind: 'error', text: e.message });
    } finally {
      setSaving(null);
    }
  }

  const columns = [
    { key: 'name', label: 'Store' },
    { key: 'address', label: 'Address', render: (r) => <span className="clamp">{r.address}</span> },
    { key: 'rating', label: 'Overall rating', render: (r) => r.rating != null
        ? <span className="inline"><StarRow value={r.rating} /> <strong>{r.rating}</strong> <span className="muted">({r.rating_count})</span></span>
        : <span className="muted">Not rated yet</span> },
    { key: 'my_rating', label: 'Your rating', render: (r) => (
        <span className="mine">
          <StarInput value={r.my_rating} disabled={saving === r.id} label={`Your rating for ${r.name}`} onChange={(n) => rate(r, n)} />
          <span className="muted">{r.my_rating ? `${r.my_rating} of 5 · tap to change` : 'Tap a star to rate'}</span>
        </span>
      ) },
  ];

  return (
    <>
      <PageHead title="Stores" sub="Find a store and rate it from 1 to 5. You can change your rating at any time." />
      <FilterBar fields={[{ name: 'q', label: 'Search by name or address' }]} filters={L.filters} setFilters={L.setFilters} />
      {L.error && <Alert>{L.error}</Alert>}
      {status.text && <Alert kind={status.kind}>{status.text}</Alert>}
      <DataTable columns={columns} rows={L.rows} loading={L.loading} sort={L.sort} order={L.order} onSort={L.onSort} empty="No stores match your search." />
    </>
  );
}
