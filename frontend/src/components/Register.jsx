import { useState } from "react";
import { register } from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { FiMail, FiUser, FiLock } from "react-icons/fi";

export default function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const data = await register(email, username, password);

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("user", data.user);
      }

      navigate("/login");
    } catch (err) {
      setError("Error al registrar usuario");
    }
  }

  return (
    <div className="fixed inset-0 flex items-stretch overflow-hidden">
      {/* */}
      <div className="hidden md:flex w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1523240795612-9a054b0db644"
          alt="Registro QuizForge"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent flex items-center justify-center text-center p-8">
          <div>
            <h1 className="text-white text-4xl font-extrabold mb-4">Únete a QuizForge</h1>
            <p className="text-white text-lg">Crea tu cuenta y comienza tu viaje de aprendizaje 🚀</p>
          </div>
        </div>
      </div>

      {/* R */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900 px-10">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100 text-center">Registro</h2>

          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/*  */}
            <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 bg-gray-50 dark:bg-gray-700">
              <FiMail className="text-blue-600 text-xl mr-3" />
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>

            {/*  */}
            <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 bg-gray-50 dark:bg-gray-700">
              <FiUser className="text-blue-600 text-xl mr-3" />
              <input
                type="text"
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>

            {/*  */}
            <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 bg-gray-50 dark:bg-gray-700">
              <FiLock className="text-blue-600 text-xl mr-3" />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md transition transform hover:scale-105"
            >
              Registrarse
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-gray-600 dark:text-gray-300">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
