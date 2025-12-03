import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  FiHome, FiUser, FiSettings, FiLogIn, FiUserPlus, FiMoon, FiSun, FiLogOut
} from "react-icons/fi";

import Inicio from "./components/Inicio";
import Quiz from "./components/Quiz";
import AttemptHistory from "./components/AttemptHistory";
import UserPanel from "./components/UserPanel";
import AdminPanel from "./components/AdminPanel";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/Login";
import Register from "./components/Register";

function App() {
  const getInitialTheme = () => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored) return stored === "dark";
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  };

  const [darkMode, setDarkMode] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  function handleLogout() {
    ["token", "role", "user", "username"].forEach((key) => localStorage.removeItem(key));
    window.location.href = "/login";
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-500">

        {/* NAVBAR */}
        <nav className="backdrop-blur-md bg-white/70 dark:bg-gray-800/70 shadow-lg border-b border-gray-200 dark:border-gray-700 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            QuizForge
          </h1>

          <ul className="hidden md:flex gap-8 text-sm font-semibold">
            <li><Link to="/inicio" className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition"><FiHome /> Inicio</Link></li>
            <li><Link to="/quiz" className="flex items-center gap-2 hover:text-purple-600 dark:hover:text-purple-400 transition">🧠 Quiz</Link></li>
            <li><Link to="/user" className="flex items-center gap-2 hover:text-green-600 dark:hover:text-green-400 transition"><FiUser /> Usuario</Link></li>
            <li><Link to="/admin" className="flex items-center gap-2 hover:text-red-600 dark:hover:text-red-400 transition"><FiSettings /> Admin</Link></li>
            <li><Link to="/login" className="flex items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition"><FiLogIn /> Login</Link></li>
            <li><Link to="/register" className="flex items-center gap-2 hover:text-pink-600 dark:hover:text-pink-400 transition"><FiUserPlus /> Registro</Link></li>
          </ul>

          <div className="flex gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              aria-label="Toggle theme"
            >
              {darkMode ? <FiSun /> : <FiMoon />}
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white flex items-center gap-2 text-sm shadow-md transition transform hover:scale-105"
            >
              <FiLogOut /> Logout
            </button>
          </div>
        </nav>

        {/* CONTENIDO CON SCROLL */}
        <main className="flex-1 overflow-y-auto p-8 animate-fadeIn">
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/inicio" element={<ProtectedRoute><Inicio /></ProtectedRoute>} />
            <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><AttemptHistory /></ProtectedRoute>} />

            <Route path="/user" element={<ProtectedRoute role="user"><UserPanel /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminPanel /></ProtectedRoute>} />

            <Route
              path="/unauthorized"
              element={
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
                  <div className="text-6xl mb-4 text-red-500">🚫</div>
                  <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Acceso denegado</h2>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                    No tienes los permisos necesarios para acceder a esta sección.
                  </p>
                  <Link
                    to="/inicio"
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold shadow-md transition transform hover:scale-105"
                  >
                    🔙 Volver al inicio
                  </Link>
                </div>
              }
            />

            <Route path="*" element={<div className="p-10 text-center text-xl">❌ 404 - Página no encontrada</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
