import { useEffect, useState } from "react";
import { fetchAttempts, fetchSummary } from "../services/api";
import { Link } from "react-router-dom";

export default function UserPanel() {
  const [attempts, setAttempts] = useState([]);
  const [summary, setSummary] = useState([]);
  const [filter, setFilter] = useState("todos");

  useEffect(() => {
    async function cargarDatos() {
      try {
        const dataAttempts = await fetchAttempts();
        setAttempts(Array.isArray(dataAttempts) ? dataAttempts : []);

        const dataSummary = await fetchSummary();
        setSummary(Array.isArray(dataSummary) ? dataSummary : []);
      } catch (err) {
        console.error("Error cargando datos:", err);
        setAttempts([]);
        setSummary([]);
      }
    }
    cargarDatos();
  }, []);

  // Datos del usuario actual
  const currentUserName = localStorage.getItem("username") || "";
  const currentUserId = localStorage.getItem("user") || "";

  // Filtro seguro
  const intentosFiltrados = (attempts || []).filter((a) => {
    if (filter === "correctos") return a.isCorrect;
    if (filter === "incorrectos") return !a.isCorrect;
    return true;
  });

  const total = intentosFiltrados.length;
  const correctos = intentosFiltrados.filter((a) => a.isCorrect).length;
  const porcentaje = total > 0 ? Math.round((correctos / total) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-4xl font-extrabold mb-8 text-center text-indigo-700 dark:text-indigo-400">
        👤 Panel de Usuario
      </h2>

      {/* Resumen general */}
      <section className="mb-10">
        <h3 className="text-2xl font-semibold mb-4 text-center">📊 Resumen de intentos</h3>
        <p className="text-center mb-4 text-gray-700 dark:text-gray-300">
          Usuario: <strong>{currentUserName}</strong> (ID: {currentUserId})
        </p>

        {summary.length === 0 ? (
          <p className="text-center text-gray-500">No hay intentos registrados aún.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {summary.map((s, idx) => {
              const totalResumen = (s.correct ?? 0) + (s.incorrect ?? 0);
              const precision = totalResumen > 0
                ? Math.round(((s.correct ?? 0) / totalResumen) * 100)
                : 0;

              return (
                <div key={idx} className="border p-6 rounded-xl shadow-md bg-gray-50 dark:bg-gray-800">
                  <p className="text-lg font-semibold mb-2">
                    ✅ Correctas: <span className="text-green-600">{s.correct ?? 0}</span> — ❌ Incorrectas:{" "}
                    <span className="text-red-600">{s.incorrect ?? 0}</span>
                  </p>
                  <p className="text-sm font-semibold mb-1">Precisión: {precision}%</p>
                  <p className="text-sm text-gray-500">Fecha: {s.created_at ? new Date(s.created_at).toLocaleString() : "—"}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Historial  */}
      <section>
        <h3 className="text-2xl font-semibold mb-6 text-center">📜 Historial detallado</h3>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-gray-700 dark:text-gray-300">Filtrar:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="todos">Todos</option>
              <option value="correctos">Solo correctos</option>
              <option value="incorrectos">Solo incorrectos</option>
            </select>
          </div>

          <p className="text-gray-700 dark:text-gray-300">
            Total: <strong>{total}</strong> — Correctos: <strong>{correctos}</strong> — Precisión: <strong>{porcentaje}%</strong>
          </p>
        </div>

        {intentosFiltrados.length === 0 ? (
          <p className="text-center text-gray-500">No hay intentos registrados.</p>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {intentosFiltrados.map((a) => {
                const esCorrecta = a.isCorrect;
                const fecha = a.answeredAt ? new Date(a.answeredAt).toLocaleString() : "—";

                return (
                  <div
                    key={a.id}
                    className={`border p-6 rounded-xl shadow-md transition ${
                      esCorrecta
                        ? "border-green-400 bg-green-50 dark:bg-green-900"
                        : "border-red-400 bg-red-50 dark:bg-red-900"
                    }`}
                  >
                    <p className="font-semibold mb-2">{a.question}</p>
                    <p className="mb-1">
                      Respuesta seleccionada: <span className="font-medium">{a.selectedAnswer ?? "—"}</span>
                    </p>
                    <p className="mb-1">
                      Resultado:{" "}
                      <span className={esCorrecta ? "text-green-600" : "text-red-600"}>
                        {esCorrecta ? "✅ Correcto" : "❌ Incorrecto"}
                      </span>
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Respondido el: {fecha}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* */}
      <div className="text-center mt-10">
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md transition transform hover:scale-105"
        >
          🔄 Volver al cuestionario
        </Link>
      </div>
    </div>
  );
}
