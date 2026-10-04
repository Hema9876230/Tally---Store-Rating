import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Alert, PageHead } from '../components/ui.jsx';
import { Hist } from '../components/Stars.jsx';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/admin/stats').then(setStats).catch((e) => setError(e.message)); }, []);

  return (
    <>
      <PageHead title="Overview" sub="A snapshot of everything on the platform." />
      {error && <Alert>{error}</Alert>}
      <div className="stats">
        {[['Users', stats?.users], ['Stores', stats?.stores], ['Ratings submitted', stats?.ratings]].map(([label, n]) => (
          <div className="stat" key={label}>
            <strong>{n ?? '–'}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      {stats && (
        <section className="panel">
          <h2>How people are rating</h2>
          {stats.ratings ? <Hist counts={stats.distribution} /> : <p className="muted">No ratings yet. They will appear here as users submit them.</p>}
        </section>
      )}
    </>
  );
}
