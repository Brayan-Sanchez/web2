import { useEffect, useState } from "react";
import { fetchQuestions, saveAttemptAnswers } from "../services/api";
import { useNavigate, useLocation } from "react-router-dom";
import "./Quiz.css";

function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [respondidas, setRespondidas] = useState({});
  const [tiempoRestante, setTiempoRestante] = useState(15);
  const [submitted, setSubmitted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const categoria = params.get("categoria");
  const dificultad = params.get("dificultad");

  const preguntaActual = questions[currentIndex];
  const seleccionada = preguntaActual ? answers[preguntaActual.id] : null;

  useEffect(() => {
    async function cargarPreguntas() {
      try {
        const data = await fetchQuestions(categoria, dificultad);
        const conOpcionesMezcladas = data.map((q) => ({
          ...q,
          opciones: [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5),
        }));
        setQuestions(conOpcionesMezcladas);
      } catch (err) {
        console.error("❌ Error al cargar preguntas:", err);
        setQuestions([]);
      }
    }

    cargarPreguntas();
  }, [categoria, dificultad]);

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
  }, [preguntaActual]);

  const seleccionarRespuesta = (idPregunta, respuesta) => {
    setAnswers((prev) => ({ ...prev, [idPregunta]: respuesta }));
    setRespondidas((prev) => ({ ...prev, [idPregunta]: true }));
  };

  const enviarRespuestas = async () => {
    setSubmitted(true);
    const intentos = questions.map((q) => ({
      user_id: 1,
      question_id: q.id,
      selected_answer: answers[q.id],
      is_correct: answers[q.id] === q.correct_answer,
    }));
    try {
      await saveAttemptAnswers(intentos);
      navigate("/history");
    } catch (err) {
      console.error("❌ Error al guardar los intentos:", err);
    }
  };

  const avanzar = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const colores = ["btn-rojo", "btn-azul", "btn-verde", "btn-dorado"];

  return (
    <div className="quiz-container dark-mode">
      <div className="quiz-card animated-card">
        <h1 className="quiz-title">🎮 ¡Comienza el Quiz!</h1>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>

        {questions.length === 0 ? (
          <p className="no-questions">No se encontraron preguntas para esta categoría y dificultad.</p>
        ) : (
          <div className="question-block">
            <p className="question-text">
              {currentIndex + 1}. {preguntaActual.question}
            </p>

            <p className="question-timer">
              Tiempo restante: <span className="text-warning">{tiempoRestante}s</span>
            </p>

            <div className="time-bar">
              <div
                className="time-fill"
                style={{ width: `${(tiempoRestante / 15) * 100}%` }}
              ></div>
            </div>

            <div className="options-grid">
              {preguntaActual.opciones.map((opcion, i) => {
                const seleccionadaEsta = seleccionada === opcion;
                const estiloCorrecta =
                  respondidas[preguntaActual.id] && opcion === preguntaActual.correct_answer ? "correcta" : "";
                const estiloIncorrecta =
                  respondidas[preguntaActual.id] &&
                  seleccionadaEsta &&
                  opcion !== preguntaActual.correct_answer
                    ? "incorrecta"
                    : "";

                return (
                  <button
                    key={i}
                    onClick={() => !respondidas[preguntaActual.id] && seleccionarRespuesta(preguntaActual.id, opcion)}
                    className={`option-button ${colores[i % colores.length]} ${
                      seleccionadaEsta ? "seleccionada" : ""
                    } ${estiloCorrecta} ${estiloIncorrecta}`}
                  >
                    {opcion}
                  </button>
                );
              })}
            </div>

            {respondidas[preguntaActual.id] && (
              <p
                className={`feedback ${
                  answers[preguntaActual.id] === preguntaActual.correct_answer
                    ? "text-success"
                    : answers[preguntaActual.id] === null
                    ? "text-warning"
                    : "text-danger"
                }`}
              >
                {answers[preguntaActual.id] === preguntaActual.correct_answer
                  ? "✅ ¡Correcto!"
                  : answers[preguntaActual.id] === null
                  ? "⏱ Tiempo agotado. Pregunta fallida."
                  : `❌ Incorrecto. Respuesta correcta: ${preguntaActual.correct_answer}`}
              </p>
            )}

            {!submitted && (
              <div className="navigation">
                {currentIndex < questions.length - 1 ? (
                  <button onClick={avanzar} className="next-button">⏭️ Siguiente pregunta</button>
                ) : (
                  <button onClick={enviarRespuestas} className="submit-button">✅ Enviar respuestas</button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Quiz;
