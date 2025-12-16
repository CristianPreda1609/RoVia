import { useEffect, useState } from 'react';

const AUTH_EVENT = 'rovia-auth-change';

const defaultState = {
  isAuthenticated: false,
  token: null,
  role: 'Visitor',
  username: 'Vizitator',
  userId: null,
};

const decodePayload = (token) => {
  if (!token || typeof token !== 'string') return null;
  try {
    const [_, payload] = token.split('.');
    if (!payload) return null;
    const padded = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, '=');
    const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const extractClaim = (payload, keys) => {
  if (!payload) return undefined;
  for (const key of keys) {
    if (payload[key] !== undefined) return payload[key];
  }
  return undefined;
};

const getSnapshot = () => {
  if (typeof window === 'undefined') return defaultState;
  try {
    const token = localStorage.getItem('token');
    if (!token) return defaultState;

    const payload = decodePayload(token);
    if (!payload) return defaultState;

    const roleClaim = extractClaim(payload, [
      'role',
      'Role',
      'roles',
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
    ]);
    const nameClaim = extractClaim(payload, [
      'name',
      'unique_name',
      'preferred_username',
      'username',
      'email',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
    ]);
    const idClaim = extractClaim(payload, [
      'sub',
      'nameid',
      'userId',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
    ]);

    const resolvedRole = Array.isArray(roleClaim) ? roleClaim[0] : roleClaim;

    return {
      isAuthenticated: true,
      token,
      role: resolvedRole || 'Visitor',
      username: nameClaim || 'Explorer',
      userId: idClaim ? Number(idClaim) || idClaim : null,
    };
  } catch {
    return defaultState;
  }
};

export const emitAuthChange = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_EVENT));
};

export default function useAuth() {
  const [auth, setAuth] = useState(() => getSnapshot());

  useEffect(() => {
    const handleChange = () => setAuth(getSnapshot());

    window.addEventListener('storage', handleChange);
    window.addEventListener(AUTH_EVENT, handleChange);

    return () => {
      window.removeEventListener('storage', handleChange);
      window.removeEventListener(AUTH_EVENT, handleChange);
    };
  }, []);

  return auth;
}
