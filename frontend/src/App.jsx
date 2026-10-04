import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth, home } from './auth.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Account from './pages/Account.jsx';
import AdminOverview from './pages/AdminOverview.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminStores from './pages/AdminStores.jsx';
import UserStores from './pages/UserStores.jsx';
import OwnerDashboard from './pages/OwnerDashboard.jsx';

function Guard({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={home(user.role)} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route element={<Guard><Layout /></Guard>}>
        <Route path="/admin" element={<Guard roles={['admin']}><AdminOverview /></Guard>} />
        <Route path="/admin/users" element={<Guard roles={['admin']}><AdminUsers /></Guard>} />
        <Route path="/admin/stores" element={<Guard roles={['admin']}><AdminStores /></Guard>} />
        <Route path="/stores" element={<Guard roles={['user']}><UserStores /></Guard>} />
        <Route path="/owner" element={<Guard roles={['owner']}><OwnerDashboard /></Guard>} />
        <Route path="/account" element={<Account />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
