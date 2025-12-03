import { useEffect, useState } from "react";
import { fetchQuestions, saveAttemptAnswers } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [respondidas, setRespondidas] = useState({});
  const [tiempoRestante, setTiempoRestante] = useState(15);
  const [submitted, setSubmitted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  const preguntaActual = questions && questions.length > 0 ? questions[currentIndex] : null;
  const seleccionada = preguntaActual ? answers[preguntaActual.id] : null;

  // Validar sesión
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  // Cargar preguntas
  useEffect(() => {
    async function cargarPreguntas() {
      try {
        const data = await fetchQuestions();
        const conOpcionesMezcladas = Array.isArray(data)
          ? data.map((q) => ({
            ...q,
            opciones: [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5),
          }))
          : [];
        setQuestions(conOpcionesMezcladas);
      } catch (err) {
        console.error("❌ Error al cargar preguntas:", err);
        setQuestions([]);
      }
    }
    cargarPreguntas();
  }, []);

  // Temporizador
  useEffect(() => {
    if (!preguntaActual || respondidas[preguntaActual.id]) return;
    setTiempoRestante(15);

    const intervalo = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(intervalo);
          seleccionarRespuesta(preguntaActual.id, null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, [preguntaActual, respondidas]);

  const seleccionarRespuesta = (idPregunta, respuesta) => {
    setAnswers((prev) => ({ ...prev, [idPregunta]: respuesta }));
    setRespondidas((prev) => ({ ...prev, [idPregunta]: true }));
  };

  const enviarRespuestas = async () => {
    setSubmitted(true);
    const intentos = (questions || []).map((q) => ({
      userId: parseInt(localStorage.getItem("user")),
      questionId: q.id,
      selectedAnswer: answers[q.id],
      isCorrect: answers[q.id] === q.correct_answer,
    }));

    try {
      const result = await saveAttemptAnswers(intentos, localStorage.getItem("token"));
      alert(
        `ID: ${result.userId}\nUsuario: ${result.username || localStorage.getItem("username") || ""
        }\nAciertos: ${result.correct}\nIncorrectos: ${result.incorrect}\nPorcentaje: ${result.percentage}%`
      );
      navigate("/history");
    } catch (err) {
      console.error("❌ Error al guardar intentos:", err);
      setSubmitted(false);
    }
  };

  const avanzar = () => {
    if (currentIndex < (questions?.length || 0) - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-6">
      <div className="bg-gray-800 text-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl animate-[scaleUp_0.5s_ease-out]">
        <h1 className="text-3xl font-bold text-purple-400 text-center mb-6">🎮 ¡Comienza el Quiz!</h1>

        {/* Barra de progreso */}
        <div className="w-full bg-gray-700 rounded-full h-3 mb-6 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-400 to-green-400 h-3 transition-all duration-500"
            style={{
              width: questions.length > 0 ? `${((currentIndex + 1) / questions.length) * 100}%` : "0%",
            }}
          ></div>
        </div>

        {questions.length === 0 ? (
          <p className="text-red-400 text-center">No se encontraron preguntas en la base de datos.</p>
        ) : (
          <div>
            <p className="text-lg font-semibold mb-2">
              {currentIndex + 1}. {preguntaActual?.question}
            </p>

            {/* Temporizador */}
            <p className="mb-2">
              Tiempo restante: <span className="text-yellow-400 font-bold">{tiempoRestante}s</span>
            </p>
            <div className="w-full bg-gray-700 h-2 rounded-full mb-6 overflow-hidden">
              <div
                className="bg-yellow-400 h-2 transition-all duration-1000"
                style={{ width: `${(tiempoRestante / 15) * 100}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(preguntaActual?.opciones || []).map((opcion, i) => {
                const seleccionadaEsta = seleccionada === opcion;
                const correcta =
                  respondidas[preguntaActual.id] && opcion === preguntaActual.correct_answer;
                const incorrecta =
                  respondidas[preguntaActual.id] &&
                  seleccionadaEsta &&
                  opcion !== preguntaActual.correct_answer;

                return (
                  <button
                    key={i}
                    onClick={() =>
                      !respondidas[preguntaActual.id] && seleccionarRespuesta(preguntaActual.id, opcion)
                    }
                    className={`p-4 rounded-xl font-semibold text-lg shadow-md transition transform hover:scale-105 
                      ${seleccionadaEsta ? "ring-4 ring-purple-400" : ""} 
                      ${correcta ? "ring-4 ring-green-400" : ""} 
                      ${incorrecta ? "ring-4 ring-red-400" : ""} 
                      ${i % 4 === 0 ? "bg-red-600" : i % 4 === 1 ? "bg-blue-600" : i % 4 === 2 ? "bg-green-600" : "bg-yellow-400 text-black"}
                    `}
                  >
                    {opcion}
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {respondidas[preguntaActual.id] && !submitted && (
              <p
                className={`mt-4 text-lg font-bold ${answers[preguntaActual.id] === preguntaActual.correct_answer
                  ? "text-green-400"
                  : answers[preguntaActual.id] === null
                    ? "text-yellow-400"
                    : "text-red-400"
                  }`}
              >
                {answers[preguntaActual.id] === preguntaActual.correct_answer
                  ? "✅ ¡Correcto!"
                  : answers[preguntaActual.id] === null
                    ? "⏱ Tiempo agotado. Pregunta fallida."
                    : `❌ Incorrecto. Respuesta correcta: ${preguntaActual.correct_answer}`}
              </p>
            )}

            {/* Navegación */}
            {!submitted && (
              <div className="mt-6 text-center">
                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={avanzar}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-semibold shadow-md transition transform hover:scale-105"
                  >
                    ⏭️ Siguiente pregunta
                  </button>
                ) : (
                  <button
                    onClick={enviarRespuestas}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-semibold shadow-md transition transform hover:scale-105"
                  >
                    ✅ Enviar respuestas
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
