const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";


// Preguntas con filtros

export async function fetchQuestions() {
  const res = await fetch(`${BASE_URL}/questions`);
  if (!res.ok) throw new Error("Error al obtener preguntas");

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchSummary() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/user/resumen`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Error al obtener resumen");
  return await res.json();
}


// Guardar intentos de respuesta

export async function saveAttemptAnswers(attempts, token) {
  const res = await fetch(`${BASE_URL}/attempts/answers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(attempts),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Error al guardar intentos");
  }
  return res.json();
}

export async function fetchAttempts() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/user/historial`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Error al obtener intentos");
  return res.json();
}
// Registro

export async function register(email, username, password) {
  const res = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password }), 
  });
  if (!res.ok) throw new Error("Error al registrar usuario");
  return res.json();
}


// Login

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Credenciales inválidas");
  return res.json(); // devuelve { token, role, user }
}


// Historial del usuario autenticado

export async function getUserAttempts(token) {
  const res = await fetch(`${BASE_URL}/user/historial`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Error al obtener intentos del usuario");
  return res.json();
}


// Historial global (admin)

export async function getAdminHistorial(token) {
  const res = await fetch(`${BASE_URL}/admin/historial`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Error al obtener historial global");
  return res.json();
}
