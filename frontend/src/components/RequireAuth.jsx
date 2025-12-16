import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

function RequireAuth({ children, allowedRoles }) {
  const location = useLocation();
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const match = allowedRoles.includes(role);
    if (!match) {
      return <Navigate to="/map" replace />;
    }
  }

  return children;
}

export default RequireAuth;
