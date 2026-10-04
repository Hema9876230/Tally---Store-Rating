import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { Brand } from './ui.jsx';

const NAV = {
  admin: [['/admin', 'Overview'], ['/admin/users', 'Users'], ['/admin/stores', 'Stores']],
  user: [['/stores', 'Stores']],
  owner: [['/owner', 'Dashboard']],
};
const ROLE = { admin: 'Administrator', user: 'Normal user', owner: 'Store owner' };

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  return (
    <div className="app">
      <aside className="side">
        <Brand light />
        <nav aria-label="Main">
          {NAV[user.role].map(([to, label]) => <NavLink key={to} to={to} end>{label}</NavLink>)}
          <NavLink to="/account">Account</NavLink>
        </nav>
        <div className="me">
          <div className="avatar" aria-hidden="true">{initials}</div>
          <div className="me-text"><strong>{user.name}</strong><span>{ROLE[user.role]}</span></div>
          <button className="btn ghost sm" onClick={() => { logout(); navigate('/login'); }}>Sign out</button>
        </div>
      </aside>
      <main id="main"><div className="content"><Outlet /></div></main>
    </div>
  );
}
