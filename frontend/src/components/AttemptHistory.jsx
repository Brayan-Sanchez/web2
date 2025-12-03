import { useEffect, useState } from "react";
import { fetchAttempts } from "../services/api";
import { Link } from "react-router-dom";

function AttemptHistory() {
  const [attempts, setAttempts] = useState([]);
  const [filter, setFilter] = useState("todos");

  useEffect(() => {
    async function cargarIntentos() {
      const data = await fetchAttempts();
      setAttempts(data);
    }
    cargarIntentos();
  }, []);

  const intentosFiltrados = attempts.filter((a) => {
    if (filter === "correctos") return a.isCorrect;
    if (filter === "incorrectos") return !a.isCorrect;
    return true;
  });

  const total = intentosFiltrados.length;
  const correctos = intentosFiltrados.filter((a) => a.isCorrect).length;
  const porcentaje = total > 0 ? Math.round((correctos / total) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6 text-center">📜 Historial de intentos</h2>

      <div className="flex justify-center mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="todos">Todos</option>
          <option value="correctos">Solo correctos</option>
          <option value="incorrectos">Solo incorrectos</option>
        </select>
      </div>

      <p className="text-center mb-6 text-gray-700 dark:text-gray-300">
        Total: <strong>{total}</strong> — Correctos: <strong>{correctos}</strong> — Precisión: <strong>{porcentaje}%</strong>
      </p>

      {intentosFiltrados.length === 0 ? (
        <p className="text-center text-gray-500">No hay intentos registrados.</p>
      ) : (
        <ul>
          {intentosFiltrados.map((a) => (
            <li
              key={a.id}
              className={`border p-4 rounded mb-4 shadow-sm ${
                a.isCorrect ? "border-green-400 bg-green-50 dark:bg-green-900" : "border-red-400 bg-red-50 dark:bg-red-900"
              }`}
            >
              <p className="font-semibold mb-1">{a.question}</p>
              <p>
                Respuesta seleccionada:{" "}
                <span className="font-medium">{a.selectedAnswer}</span>
              </p>
              <p>
                Resultado:{" "}
                <span className={a.isCorrect ? "text-green-600" : "text-red-600"}>
                  {a.isCorrect ? "✅ Correcto" : "❌ Incorrecto"}
                </span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Respondido el: {new Date(a.answeredAt).toLocaleString()}
              </p>
              {a.username && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Usuario: {a.username}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="text-center mt-8">
        <Link
          to="/"
          className="inline-block px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          🔄 Volver al cuestionario
        </Link>
      </div>
    </div>
  );
}

export default AttemptHistory;
