import { useEffect, useState } from "react";
import { fetchSummary } from "../services/api";

function UserSummary() {
  const [summary, setSummary] = useState([]);

  useEffect(() => {
    async function cargarResumen() {
      const data = await fetchSummary();
      setSummary(data);
    }
    cargarResumen();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4 text-center">📊 Resumen de intentos</h2>

      {summary.length === 0 ? (
        <p className="text-center text-gray-500">No hay intentos registrados aún.</p>
      ) : (
        <ul>
          {summary.map((s, idx) => (
            <li
              key={idx}
              className="border p-4 rounded mb-4 shadow-sm bg-gray-50 dark:bg-gray-800"
            >
              <p>
                ✅ Correctas: <strong>{s.correct}</strong> — ❌ Incorrectas:{" "}
                <strong>{s.incorrect}</strong>
              </p>
              <p className="text-sm text-gray-500">
                Fecha: {new Date(s.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UserSummary;
