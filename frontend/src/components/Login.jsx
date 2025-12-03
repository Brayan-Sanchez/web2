import { useState, useEffect } from "react";
import { login } from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { FiMail, FiLock } from "react-icons/fi";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/inicio");
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("user", data.user);
      if (data.username) localStorage.setItem("username", data.username);
      navigate("/inicio");
    } catch {
      setError("Correo o contraseña incorrectos");
    }
  }

  return (
    <div className="fixed inset-0 flex items-stretch overflow-hidden">
      {/* LEFT SIDE: FORM */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-10 bg-white dark:bg-gray-900">
        <h2 className="text-4xl font-bold mb-4 text-gray-800 dark:text-white">Inicia sesión</h2>
        <p className="text-gray-500 dark:text-gray-300 mb-6 text-center">Bienvenido de nuevo, nos alegra verte ✨</p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <form className="w-full max-w-md space-y-5" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Correo electrónico</label>
            <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-purple-500 bg-gray-50 dark:bg-gray-800">
              <FiMail className="text-purple-600 text-xl mr-3" />
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contraseña</label>
            <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-purple-500 bg-gray-50 dark:bg-gray-800">
              <FiLock className="text-purple-600 text-xl mr-3" />
              <input
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
          </div>

          <Link to="/forgot-password" className="text-purple-600 text-sm hover:underline block text-right">
            ¿Olvidaste tu contraseña?
          </Link>

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold shadow-md transition transform hover:scale-105"
          >
            Entrar
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-700 dark:text-gray-300">
          ¿No tienes cuenta?{" "}
          <Link className="text-purple-600 font-semibold hover:underline" to="/register">
            Regístrate
          </Link>
        </p>
      </div>

      {/* RIGHT SIDE: IMAGE */}
      <div className="w-full md:w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1507842217343-583bb7270b66"
          alt="Login background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/70 to-transparent flex items-center justify-center text-center p-6">
          <div>
            <h2 className="text-white text-3xl font-bold mb-2">Bienvenido a QuizForge</h2>
            <p className="text-white text-sm">Tu viaje empieza aquí 🚀</p>
          </div>
        </div>
      </div>
    </div>
  );
}
