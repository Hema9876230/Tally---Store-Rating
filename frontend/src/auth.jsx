import { createContext, useContext, useEffect, useState } from 'react';
import { api, session } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
export const home = (role) => ({ admin: '/admin', owner: '/owner', user: '/stores' }[role] || '/login');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(session.user);

  const finish = ({ token, user }) => { session.save(token, user); setUser(user); };
  const login = async (body) => finish(await api('/auth/login', { method: 'POST', body }));
  const signup = async (body) => finish(await api('/auth/signup', { method: 'POST', body }));
  const updateProfile = async (body) => finish(await api('/auth/profile', { method: 'PUT', body }));
  const logout = () => { session.clear(); setUser(null); };

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('tally:unauthorized', onExpired);
    return () => window.removeEventListener('tally:unauthorized', onExpired);
  }, []);

  return <Ctx.Provider value={{ user, login, signup, updateProfile, logout }}>{children}</Ctx.Provider>;
}
