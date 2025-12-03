import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [newUser, setNewUser] = useState({ email: "", username: "", password: "", role: "user" });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No autenticado: inicia sesión como admin para ver usuarios");

      const res = await fetch("http://localhost:8080/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Error al obtener usuarios (status ${res.status})`);
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loadUsers:", err);
      setError(err.message || "No se pudo cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) throw new Error("Error al crear usuario");
      setNewUser({ email: "", username: "", password: "", role: "user" });
      loadUsers();
    } catch (err) {
      console.error(err);
      setError("Error al crear usuario");
    }
  };

  const handleUpdateRole = async (id, role) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Error al actualizar rol");
      loadUsers();
    } catch (err) {
      console.error(err);
      setError("Error al actualizar rol");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar usuario? Esta acción es irreversible.")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al eliminar usuario");
      loadUsers();
    } catch (err) {
      console.error(err);
      setError("Error al eliminar usuario");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-auto">
      <div className="w-full max-w-6xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-10">
        <h2 className="text-4xl font-extrabold mb-8 text-center text-indigo-700 dark:text-indigo-400">
          🛠️ Panel de Administrador
        </h2>

        {error && <p className="text-red-500 text-center mb-6">{error}</p>}

        {/* Crear usuario */}
        <section className="mb-10">
          <h3 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">➕ Crear usuario</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              required
              placeholder="Email"
              value={newUser.email}
              onChange={(e)=>setNewUser({...newUser,email:e.target.value})}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 
                         bg-gray-50 dark:bg-gray-800 
                         text-gray-900 dark:text-white 
                         placeholder-gray-400"
            />
            <input
              required
              placeholder="Username"
              value={newUser.username}
              onChange={(e)=>setNewUser({...newUser,username:e.target.value})}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 
                         bg-gray-50 dark:bg-gray-800 
                         text-gray-900 dark:text-white 
                         placeholder-gray-400"
            />
            <input
              required
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={(e)=>setNewUser({...newUser,password:e.target.value})}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 
                         bg-gray-50 dark:bg-gray-800 
                         text-gray-900 dark:text-white 
                         placeholder-gray-400"
            />
            <div className="flex gap-2">
              <select
                value={newUser.role}
                onChange={(e)=>setNewUser({...newUser,role:e.target.value})}
                className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 
                           bg-gray-50 dark:bg-gray-800 
                           text-gray-900 dark:text-white"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="submit"
                className="px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-md transition transform hover:scale-105"
              >
                Crear
              </button>
            </div>
          </form>
        </section>

        {/* Tabla de usuarios */}
        <section>
          <h3 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">👥 Usuarios</h3>
          {loading ? (
            <p className="text-center text-gray-600 dark:text-gray-400">Cargando...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse rounded-lg overflow-hidden shadow-md">
                <thead className="bg-indigo-600 text-white">
                  <tr>
                    <th className="p-3 text-left">ID</th>
                    <th className="p-3 text-left">Username</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Role</th>
                    <th className="p-3 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, idx) => (
                    <tr key={u.id} className={idx % 2 === 0 ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-700"}>
                      <td className="p-3">{u.id}</td>
                      <td className="p-3">{u.username}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">
                        <select
                          value={u.role}
                          onChange={(e)=>handleUpdateRole(u.id, e.target.value)}
                          className="p-2 border rounded focus:ring-2 focus:ring-indigo-500 
                                     bg-gray-50 dark:bg-gray-800 
                                     text-gray-900 dark:text-white"
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={()=>handleDelete(u.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition transform hover:scale-105"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="text-center mt-10">
          <Link to="/" className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md transition transform hover:scale-105">
            🔄 Volver al cuestionario
          </Link>
        </div>
      </div>
    </div>
  );
}
