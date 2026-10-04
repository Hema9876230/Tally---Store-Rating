import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useListing } from '../hooks.js';
import DataTable from '../components/DataTable.jsx';
import { Alert, FilterBar, Form, Modal, PageHead } from '../components/ui.jsx';
import { StarRow } from '../components/Stars.jsx';

const FILTERS = [
  { name: 'name', label: 'Filter by name' },
  { name: 'email', label: 'Filter by email' },
  { name: 'address', label: 'Filter by address' },
];

// Adds a store, or edits one when `store` is passed.
function StoreModal({ store, onClose, onDone }) {
  const [owners, setOwners] = useState([]);
  useEffect(() => { api('/admin/users', { params: { role: 'owner', sort: 'name' } }).then(setOwners).catch(() => {}); }, []);

  const fields = [
    { name: 'name', label: 'Store name', rule: 'storeName' },
    { name: 'email', label: 'Store email', type: 'email', rule: 'email' },
    { name: 'address', label: 'Address', type: 'textarea', rule: 'address', hint: 'Up to 400 characters' },
    { name: 'ownerId', label: 'Store owner', type: 'select', hint: 'Owners can see the ratings for their stores.',
      options: [{ value: '', label: 'No owner assigned' }, ...owners.map((o) => ({ value: String(o.id), label: `${o.name} (${o.email})` }))] },
  ];
  const initial = store
    ? { name: store.name, email: store.email, address: store.address, ownerId: store.owner_id ? String(store.owner_id) : '' }
    : {};

  return (
    <Modal title={store ? 'Edit store' : 'Add store'} onClose={onClose}>
      <Form
        key={owners.length}
        fields={fields}
        initial={initial}
        submitLabel={store ? 'Save changes' : 'Add store'}
        busyLabel={store ? 'Saving…' : 'Adding…'}
        onCancel={onClose}
        onSubmit={async (v) => {
          const body = { ...v, ownerId: v.ownerId ? Number(v.ownerId) : null };
          await api(store ? `/admin/stores/${store.id}` : '/admin/stores', { method: store ? 'PUT' : 'POST', body });
          onDone();
        }}
      />
    </Modal>
  );
}

export default function AdminStores() {
  const L = useListing('/admin/stores', 'name');
  const [modal, setModal] = useState(null); // { store: null } = add, { store: row } = edit

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Address', render: (r) => <span className="clamp">{r.address}</span> },
    { key: 'rating', label: 'Rating', render: (r) => r.rating != null
        ? <span className="inline"><StarRow value={r.rating} /> <strong>{r.rating}</strong> <span className="muted">({r.rating_count})</span></span>
        : <span className="muted">No ratings</span> },
  ];

  return (
    <>
      <PageHead
        title="Stores"
        sub="Every store registered on Tally. Select a row to edit it."
        action={<button className="btn" onClick={() => setModal({ store: null })}>Add store</button>}
      />
      <FilterBar fields={FILTERS} filters={L.filters} setFilters={L.setFilters} />
      {L.error && <Alert>{L.error}</Alert>}
      <DataTable columns={columns} rows={L.rows} loading={L.loading} sort={L.sort} order={L.order} onSort={L.onSort}
        onRowClick={(row) => setModal({ store: row })} empty="No stores match these filters." />
      {modal && <StoreModal store={modal.store} onClose={() => setModal(null)} onDone={() => { setModal(null); L.reload(); }} />}
    </>
  );
}
