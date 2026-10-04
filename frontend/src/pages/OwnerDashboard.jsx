import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useLocalSort } from '../hooks.js';
import DataTable from '../components/DataTable.jsx';
import { Alert, PageHead } from '../components/ui.jsx';
import { StarRow } from '../components/Stars.jsx';

export default function OwnerDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/owner/dashboard').then(setData).catch((e) => setError(e.message)); }, []);
  const T = useLocalSort(data?.raters || [], 'updated_at');

  if (error) return <Alert>{error}</Alert>;
  if (!data) return <p className="muted">Loading your dashboard…</p>;
  if (!data.stores.length)
    return (
      <>
        <PageHead title="Dashboard" />
        <div className="panel"><p>No store is linked to your account yet. Ask an administrator to assign one.</p></div>
      </>
    );

  const many = data.stores.length > 1;
  const columns = [
    { key: 'name', label: 'Customer' },
    { key: 'email', label: 'Email' },
    ...(many ? [{ key: 'store_name', label: 'Store' }] : []),
    { key: 'rating', label: 'Rating', render: (r) => <span className="inline"><StarRow value={r.rating} /> <strong>{r.rating}</strong></span> },
    { key: 'updated_at', label: 'Rated on', render: (r) => new Date(r.updated_at).toLocaleDateString() },
  ];

  return (
    <>
      <PageHead title="Dashboard" sub={many ? 'How your stores are rated.' : data.stores[0].name} />
      <div className="stats">
        <div className="stat">
          <strong>{data.overall.rating ?? '–'}</strong>
          <span>Average rating {data.overall.rating != null && <StarRow value={data.overall.rating} size={15} />}</span>
        </div>
        <div className="stat"><strong>{data.overall.rating_count}</strong><span>Ratings received</span></div>
        {many && data.stores.map((s) => (
          <div className="stat" key={s.id}><strong>{s.rating ?? '–'}</strong><span>{s.name}</span></div>
        ))}
      </div>
      <h2 className="section-title">Customers who rated your {many ? 'stores' : 'store'}</h2>
      <DataTable columns={columns} rows={T.rows} sort={T.sort} order={T.order} onSort={T.onSort} empty="No one has rated your store yet." />
    </>
  );
}
