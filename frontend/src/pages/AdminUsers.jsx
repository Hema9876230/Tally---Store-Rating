import { useState } from 'react';
import { api } from '../api.js';
import { useListing } from '../hooks.js';
import DataTable from '../components/DataTable.jsx';
import { Alert, FilterBar, Form, Modal, PageHead } from '../components/ui.jsx';
import { StarRow } from '../components/Stars.jsx';
import { PW_HINT } from '../validate.js';

const ROLES = [{ value: 'admin', label: 'Admin' }, { value: 'user', label: 'Normal user' }, { value: 'owner', label: 'Store owner' }];
const ROLE_LABEL = Object.fromEntries(ROLES.map((r) => [r.value, r.label]));

const FILTERS = [
  { name: 'name', label: 'Filter by name' },
  { name: 'email', label: 'Filter by email' },
  { name: 'address', label: 'Filter by address' },
  { name: 'role', label: 'All roles', options: ROLES },
];

const FIELDS = [
  { name: 'name', label: 'Full name', rule: 'name', hint: 'Up to 60 characters' },
  { name: 'email', label: 'Email', type: 'email', rule: 'email' },
  { name: 'address', label: 'Address', type: 'textarea', rule: 'address', hint: 'Up to 400 characters' },
  { name: 'password', label: 'Temporary password', type: 'password', rule: 'password', hint: PW_HINT },
  { name: 'role', label: 'Role', type: 'select', options: ROLES },
];

export default function AdminUsers() {
  const L = useListing('/admin/users', 'name');
  const [adding, setAdding] = useState(false);
  const [detail, setDetail] = useState(null);

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Address', render: (r) => <span className="clamp">{r.address}</span> },
    { key: 'role', label: 'Role', render: (r) => <span className={`pill ${r.role}`}>{ROLE_LABEL[r.role]}</span> },
  ];

  return (
    <>
      <PageHead title="Users" sub="Everyone with access to Tally. Select a row for details." action={<button className="btn" onClick={() => setAdding(true)}>Add user</button>} />
      <FilterBar fields={FILTERS} filters={L.filters} setFilters={L.setFilters} />
      {L.error && <Alert>{L.error}</Alert>}
      <DataTable columns={columns} rows={L.rows} loading={L.loading} sort={L.sort} order={L.order} onSort={L.onSort} onRowClick={setDetail} empty="No users match these filters." />

      {adding && (
        <Modal title="Add user" onClose={() => setAdding(false)}>
          <Form fields={FIELDS} initial={{ role: 'user' }} submitLabel="Add user" busyLabel="Adding…" onCancel={() => setAdding(false)}
            onSubmit={async (v) => { await api('/admin/users', { method: 'POST', body: v }); setAdding(false); L.reload(); }} />
        </Modal>
      )}

      {detail && (
        <Modal title="User details" onClose={() => setDetail(null)}>
          <dl className="dl">
            <dt>Name</dt><dd>{detail.name}</dd>
            <dt>Email</dt><dd>{detail.email}</dd>
            <dt>Address</dt><dd>{detail.address}</dd>
            <dt>Role</dt><dd>{ROLE_LABEL[detail.role]}</dd>
            {detail.role === 'owner' && (
              <>
                <dt>Store rating</dt>
                <dd>{detail.rating != null ? <span className="inline"><StarRow value={detail.rating} /> {detail.rating}</span> : 'No ratings yet'}</dd>
              </>
            )}
          </dl>
        </Modal>
      )}
    </>
  );
}
