package main

// Usuario del sistema
type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"` // "admin" o "user"
}

// Pregunta almacenada
type Question struct {
	ID               int      `json:"id"`
	Question         string   `json:"question"`
	CorrectAnswer    string   `json:"correct_answer"`
	IncorrectAnswers []string `json:"incorrect_answers"`
}

// Intento/respuesta del usuario
// Intento/respuesta del usuario
type AttemptAnswer struct {
	UserID         int    `json:"userId"`
	QuestionID     int    `json:"questionId"`
	SelectedAnswer string `json:"selectedAnswer"`
	IsCorrect      bool   `json:"isCorrect"`
}

type AttemptView struct {
	ID             int    `json:"id"`
	UserID         int    `json:"userId"`
	Question       string `json:"question"`
	SelectedAnswer string `json:"selectedAnswer"`
	IsCorrect      bool   `json:"isCorrect"`
	AnsweredAt     string `json:"answeredAt"`
	Username       string `json:"username"`
}

// Respuesta de OpenTDB
type APIResponse struct {
	Results []struct {
		Question         string   `json:"question"`
		CorrectAnswer    string   `json:"correct_answer"`
		IncorrectAnswers []string `json:"incorrect_answers"`
		Category         string   `json:"category"`
		Difficulty       string   `json:"difficulty"`
	} `json:"results"`
}
