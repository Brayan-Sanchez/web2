package main

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/lib/pq"
)

// Estructuras
type AttemptAnswer struct {
	UserID         int    `json:"user_id"`
	QuestionID     int    `json:"question_id"`
	SelectedAnswer string `json:"selected_answer"`
	IsCorrect      bool   `json:"is_correct"`
}

type Question struct {
	ID               int      `json:"id"`
	Question         string   `json:"question"`
	CorrectAnswer    string   `json:"correct_answer"`
	IncorrectAnswers []string `json:"incorrect_answers"`
}

type APIResponse struct {
	Results []struct {
		Question         string   `json:"question"`
		CorrectAnswer    string   `json:"correct_answer"`
		IncorrectAnswers []string `json:"incorrect_answers"`
		Category         string   `json:"category"`
		Difficulty       string   `json:"difficulty"`
	} `json:"results"`
}

// Guardar respuestas individuales
func SaveAttemptAnswers(w http.ResponseWriter, r *http.Request) {
	var answers []AttemptAnswer
	err := json.NewDecoder(r.Body).Decode(&answers)
	if err != nil {
		http.Error(w, "Solicitud inválida", http.StatusBadRequest)
		return
	}

	for _, a := range answers {
		_, err := DB.Exec(`
            INSERT INTO attempts (user_id, question_id, selected_answer, is_correct)
            VALUES ($1, $2, $3, $4)`,
			a.UserID, a.QuestionID, a.SelectedAnswer, a.IsCorrect)
		if err != nil {
			http.Error(w, "Error al guardar el intento", http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("Respuestas guardadas correctamente"))
}

// Obtener preguntas desde OpenTDB y guardarlas
func FetchAndSaveQuestions(w http.ResponseWriter, r *http.Request) {
	resp, err := http.Get("https://opentdb.com/api.php?amount=10&type=multiple")
	if err != nil {
		http.Error(w, "Error al obtener preguntas", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var apiResp APIResponse
	json.Unmarshal(body, &apiResp)

	// Diccionarios de traducción
	categorias := map[string]string{
		"General Knowledge": "Cultura general",
		"Video Games":       "Videojuegos",
		"History":           "Historia",
		"Art":               "Arte",
		"Science":           "Ciencia",
		"Geography":         "Geografía",
		"Entertainment":     "Entretenimiento",
		"Sports":            "Deportes",
		"Politics":          "Política",
		"Animals":           "Animales",
		"Vehicles":          "Vehículos",
		"Computers":         "Informática",
	}

	dificultades := map[string]string{
		"easy":   "fácil",
		"medium": "media",
		"hard":   "difícil",
	}

	for _, q := range apiResp.Results {
		catTraducida := categorias[q.Category]
		if catTraducida == "" {
			catTraducida = q.Category // si no está en el diccionario, se guarda tal cual
		}

		difTraducida := dificultades[q.Difficulty]
		if difTraducida == "" {
			difTraducida = q.Difficulty
		}

		_, err := DB.Exec(`
            INSERT INTO questions (question, correct_answer, incorrect_answers, categoria, dificultad)
            VALUES ($1, $2, $3, $4, $5)`,
			q.Question, q.CorrectAnswer, pq.Array(q.IncorrectAnswers), catTraducida, difTraducida)
		if err != nil {
			http.Error(w, "Error al guardar pregunta", http.StatusInternalServerError)
			return
		}
	}

	w.Write([]byte("Preguntas guardadas exitosamente con traducción al español"))
}

// Obtener preguntas guardadas con filtros
func GetQuestions(w http.ResponseWriter, r *http.Request) {
	categoria := r.URL.Query().Get("categoria")
	dificultad := r.URL.Query().Get("dificultad")

	query := "SELECT id, question, correct_answer, incorrect_answers FROM questions"
	var args []interface{}
	var conditions []string

	if categoria != "" {
		conditions = append(conditions, "categoria = $1")
		args = append(args, categoria)
	}
	if dificultad != "" {
		conditions = append(conditions, "dificultad = $2")
		args = append(args, dificultad)
	}
	if len(conditions) > 0 {
		query += " WHERE " + conditions[0]
		if len(conditions) == 2 {
			query += " AND " + conditions[1]
		}
	}

	query += " ORDER BY created_at DESC"

	rows, err := DB.Query(query, args...)
	if err != nil {
		http.Error(w, "Error al obtener preguntas", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var questions []Question
	for rows.Next() {
		var q Question
		err := rows.Scan(&q.ID, &q.Question, &q.CorrectAnswer, pq.Array(&q.IncorrectAnswers))
		if err != nil {
			http.Error(w, "Error al procesar pregunta", http.StatusInternalServerError)
			return
		}
		questions = append(questions, q)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(questions)
}

// Obtener historial de intentos
func GetAttempts(w http.ResponseWriter, r *http.Request) {
	rows, err := DB.Query(`
        SELECT a.id, q.question, a.selected_answer, a.is_correct, a.answered_at
        FROM attempts a
        JOIN questions q ON a.question_id = q.id
        ORDER BY a.answered_at DESC
        LIMIT 20`)
	if err != nil {
		http.Error(w, "Error al obtener intentos", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type AttemptView struct {
		ID             int    `json:"id"`
		Question       string `json:"question"`
		SelectedAnswer string `json:"selected_answer"`
		IsCorrect      bool   `json:"is_correct"`
		AnsweredAt     string `json:"answered_at"`
	}

	var attempts []AttemptView
	for rows.Next() {
		var a AttemptView
		err := rows.Scan(&a.ID, &a.Question, &a.SelectedAnswer, &a.IsCorrect, &a.AnsweredAt)
		if err != nil {
			http.Error(w, "Error al procesar intento", http.StatusInternalServerError)
			return
		}
		attempts = append(attempts, a)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(attempts)
}
