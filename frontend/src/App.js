import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Quiz from "./components/Quiz";
import AttemptHistory from "./components/AttemptHistory";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <Router>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white p-6">
        <nav className="flex justify-between items-center mb-8">
          <div className="flex gap-6">
            <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold text-lg">
              🧠 Quiz
            </Link>
            <Link to="/history" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold text-lg">
              📜 History
            </Link>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded text-sm"
          >
            {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </nav>

        <Routes>
          <Route path="/" element={<Quiz />} />
          <Route path="/history" element={<AttemptHistory />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
