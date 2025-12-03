const BASE_URL = "http://localhost:8080";

export async function fetchQuestions(categoria, dificultad) {
  let url = `${BASE_URL}/questions`;

  // Agrega filtros solo si están definidos
  const params = [];
  if (categoria) params.push(`categoria=${categoria}`);
  if (dificultad) params.push(`dificultad=${dificultad}`);
  if (params.length > 0) url += `?${params.join("&")}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al obtener preguntas");

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function saveAttemptAnswers(attempts) {
  const res = await fetch(`${BASE_URL}/attempts/answers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(attempts),
  });
  if (!res.ok) throw new Error("Error al guardar intentos");
  return res.text();
}

export async function fetchAttempts() {
  const res = await fetch(`${BASE_URL}/attempts`);
  if (!res.ok) throw new Error("Error al obtener historial");
  return res.json();
}
