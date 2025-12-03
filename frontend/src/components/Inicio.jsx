import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Inicio() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const comenzarQuiz = () => {
    navigate("/quiz");
  };

  return (
    <div className="fixed inset-0 flex items-stretch overflow-hidden">
      {/* LEFT SIDE: IMAGE + MENSAJE */}
      <div className="w-full md:w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1581091870622-1e7b1c7c5b6b"
          alt="Bienvenida QuizForge"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 to-transparent flex items-center justify-center text-center p-8">
          <div>
            <h1 className="text-white text-4xl font-extrabold mb-4">Bienvenido a QuizForge</h1>
            <p className="text-white text-lg">Explora, aprende y reta tu mente. Tu viaje comienza ahora 🚀</p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: BOTÓN DE INICIO */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center bg-white dark:bg-gray-900 px-10">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-indigo-700 dark:text-indigo-400 mb-6">¿Listo para comenzar?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Accede al cuestionario y demuestra tu conocimiento. ¡Es rápido, divertido y sin complicaciones!
          </p>
          <button
            onClick={comenzarQuiz}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold px-6 py-3 rounded-full shadow-md transition transform hover:scale-105"
          >
            🧠 Empezar cuestionario
          </button>
        </div>
      </div>
    </div>
  );
}

export default Inicio;
