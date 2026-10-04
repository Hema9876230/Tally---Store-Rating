import { Link, Navigate } from 'react-router-dom';
import { useAuth, home } from '../auth.jsx';
import { Form } from '../components/ui.jsx';
import AuthShell from '../components/AuthShell.jsx';

const FIELDS = [
  { name: 'email', label: 'Email', type: 'email', rule: 'email', autoComplete: 'username', placeholder: 'you@example.com' },
  { name: 'password', label: 'Password', type: 'password', rule: (v) => !!v || 'Enter your password', autoComplete: 'current-password' },
];

export default function Login() {
  const { user, login } = useAuth();
  if (user) return <Navigate to={home(user.role)} replace />;
  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back. Enter your account details to continue."
      footer={<>New to Tally? <Link to="/signup">Create an account</Link></>}
    >
      <Form fields={FIELDS} onSubmit={login} submitLabel="Sign in" busyLabel="Signing in…" block />
    </AuthShell>
  );
}
