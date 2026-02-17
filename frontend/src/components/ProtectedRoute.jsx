import { Navigate } from 'react-router-dom';
import useStore from '../store';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useStore();
  const token = localStorage.getItem('token');

  if (!token || !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
