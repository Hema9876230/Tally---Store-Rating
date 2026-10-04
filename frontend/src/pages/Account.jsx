import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Alert, Form, PageHead } from '../components/ui.jsx';
import { PW_HINT } from '../validate.js';

const PROFILE = [
  { name: 'name', label: 'Full name', rule: 'name', hint: 'Up to 60 characters', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', rule: 'email', autoComplete: 'email' },
  { name: 'address', label: 'Address', type: 'textarea', rule: 'address', hint: 'Up to 400 characters', autoComplete: 'street-address' },
];

const PASSWORD = [
  { name: 'currentPassword', label: 'Current password', type: 'password', rule: 'required', autoComplete: 'current-password' },
  { name: 'newPassword', label: 'New password', type: 'password', rule: 'password', hint: PW_HINT, autoComplete: 'new-password' },
  { name: 'confirm', label: 'Confirm new password', type: 'password', rule: (v, all) => v === all.newPassword || 'Passwords do not match', autoComplete: 'new-password' },
];

export default function Account() {
  const { updateProfile } = useAuth();
  const [me, setMe] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/auth/me').then(setMe).catch((e) => setError(e.message)); }, []);

  return (
    <>
      <PageHead title="Account" sub="Update your details and password." />
      {error && <Alert>{error}</Alert>}
      <section className="panel narrow">
        <h2>Profile</h2>
        {me ? (
          <Form
            fields={PROFILE}
            initial={me}
            submitLabel="Save changes"
            busyLabel="Saving…"
            onSubmit={async (v) => { await updateProfile(v); return 'Profile updated.'; }}
          />
        ) : !error && <p className="muted">Loading…</p>}
      </section>
      <section className="panel narrow">
        <h2>Password</h2>
        <Form
          fields={PASSWORD}
          resetOnSuccess
          submitLabel="Update password"
          busyLabel="Updating…"
          onSubmit={async ({ currentPassword, newPassword }) => {
            await api('/auth/password', { method: 'PUT', body: { currentPassword, newPassword } });
            return 'Password updated.';
          }}
        />
      </section>
    </>
  );
}
