import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Inicio() {
  const [categoria, setCategoria] = useState("general");
  const [dificultad, setDificultad] = useState("media");
  const navigate = useNavigate();

  const comenzarQuiz = () => {
    navigate(`/quiz?categoria=${categoria}&dificultad=${dificultad}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-500 flex items-center justify-center px-4 py-10">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl p-8 text-center animate-fade-in">
        <h1 className="text-4xl font-bold text-indigo-700 mb-4">🧠 QuizForge</h1>
        <p className="text-lg text-gray-700 mb-6">Selecciona una categoría y dificultad para comenzar:</p>

        {/* Categoría */}
        <div className="mb-6 text-left">
          <label className="block text-sm font-semibold text-gray-600 mb-2">Categoría:</label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="general">Cultura general</option>
            <option value="videojuegos">Videojuegos</option>
            <option value="historia">Historia</option>
            <option value="arte">Arte</option>
            <option value="ciencia">Ciencia</option>
          </select>
        </div>

        {/* Dificultad */}
        <div className="mb-8 text-left">
          <label className="block text-sm font-semibold text-gray-600 mb-2">Dificultad:</label>
          <select
            value={dificultad}
            onChange={(e) => setDificultad(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="facil">Fácil</option>
            <option value="media">Media</option>
            <option value="dificil">Difícil</option>
          </select>
        </div>

        {/* Botón de inicio */}
        <button
          onClick={comenzarQuiz}
          className="bg-indigo-600 text-white text-lg font-semibold px-6 py-3 rounded-full hover:bg-indigo-700 transition-all duration-200 shadow-md"
        >
          🚀 Comenzar cuestionario
        </button>
      </div>
    </div>
  );
}

export default Inicio;
