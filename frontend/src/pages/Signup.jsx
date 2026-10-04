import { Link, Navigate } from 'react-router-dom';
import { useAuth, home } from '../auth.jsx';
import { Form } from '../components/ui.jsx';
import AuthShell from '../components/AuthShell.jsx';
import { PW_HINT } from '../validate.js';

const FIELDS = [
  { name: 'name', label: 'Full name', rule: 'name', hint: 'Up to 60 characters', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', rule: 'email', autoComplete: 'email' },
  { name: 'address', label: 'Address', type: 'textarea', rule: 'address', hint: 'Up to 400 characters', autoComplete: 'street-address' },
  { name: 'password', label: 'Password', type: 'password', rule: 'password', hint: PW_HINT, autoComplete: 'new-password' },
];

export default function Signup() {
  const { user, signup } = useAuth();
  if (user) return <Navigate to={home(user.role)} replace />;
  return (
    <AuthShell
      title="Create your account"
      subtitle="Sign up to rate the stores you visit."
      footer={<>Already have an account? <Link to="/login">Sign in</Link></>}
    >
      <Form fields={FIELDS} onSubmit={signup} submitLabel="Create account" busyLabel="Creating account…" block />
    </AuthShell>
  );
}
