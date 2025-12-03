import { Navigate } from "react-router-dom";

function ProtectedRoute({ role, children }) {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  // Si no hay token, redirige al login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si se requiere un rol específico y no coincide, redirige a "No autorizado"
  if (role && userRole !== role) {
    return <Navigate to="/unauthorized" replace />;
  }

  //Si todo está bien, renderiza el contenido
  return children;
}

export default ProtectedRoute;
