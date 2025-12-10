package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

func GetUserAttempts(w http.ResponseWriter, r *http.Request) {
	// Validar token en el header Authorization
	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		http.Error(w, "Token faltante", http.StatusUnauthorized)
		return
	}
	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

	// Verificar token y extraer claims
	claims, err := VerifyToken(tokenStr)
	if err != nil {
		http.Error(w, "Token inválido", http.StatusUnauthorized)
		return
	}

	// Extraer userID del token
	userID, ok := claims["user"].(float64)
	if !ok {
		http.Error(w, "ID de usuario no válido", http.StatusBadRequest)
		return
	}

	// Consultar intentos del usuario
	rows, err := DB.Query(`
		SELECT a.id, a.user_id, q.question, a.selected_answer, a.is_correct, a.answered_at, u.username
		FROM attempts a
		JOIN questions q ON a.question_id = q.id
		JOIN users u ON a.user_id = u.id
		WHERE a.user_id = $1
		ORDER BY a.answered_at DESC`, int(userID))
	if err != nil {
		http.Error(w, "Error al obtener intentos del usuario", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var attempts []AttemptView
	for rows.Next() {
		var a AttemptView
		var answeredAt time.Time
		if err := rows.Scan(&a.ID, &a.UserID, &a.Question, &a.SelectedAnswer, &a.IsCorrect, &answeredAt, &a.Username); err != nil {
			http.Error(w, "Error al procesar intento", http.StatusInternalServerError)
			return
		}
		a.AnsweredAt = answeredAt.Format(time.RFC3339)
		attempts = append(attempts, a)
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(attempts)
}

// Registro de usuario (rol por defecto "user")

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	var user User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Solicitud inválida", http.StatusBadRequest)
		return
	}

	if user.Email == "" || user.Password == "" || user.Username == "" {
		http.Error(w, "Email, username y contraseña son requeridos", http.StatusBadRequest)
		return
	}

	// Encriptar contraseña
	hashed, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Error al encriptar contraseña", http.StatusInternalServerError)
		return
	}

	user.Role = "user"
	if _, err := DB.Exec(`INSERT INTO users (email, username, password, role) VALUES ($1, $2, $3, $4)`,
		user.Email, user.Username, string(hashed), user.Role); err != nil {

		log.Println("❌ Error al registrar usuario:", err)

		if strings.Contains(err.Error(), "duplicate key") {
			http.Error(w, "Usuario ya existe", http.StatusConflict)
			return
		}

		http.Error(w, "Error al registrar", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "Registrado correctamente"})
}

// Login y emisión de token

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("📥 LoginHandler recibió una solicitud")
	var creds User
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "Solicitud inválida", http.StatusBadRequest)
		return
	}

	// Buscar por email o username
	var user User
	row := DB.QueryRow(`
        SELECT id, email, username, password, role 
        FROM users 
        WHERE email = $1 OR username = $2`, creds.Email, creds.Username)

	if err := row.Scan(&user.ID, &user.Email, &user.Username, &user.Password, &user.Role); err != nil {
		http.Error(w, "Usuario no encontrado", http.StatusUnauthorized)
		return
	}

	// Comparar contraseña encriptada
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(creds.Password)); err != nil {
		http.Error(w, "Credenciales inválidas", http.StatusUnauthorized)
		return
	}

	// Generar token con userID y rol
	token, _ := GenerateToken(user.Email, user.Role, user.ID)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"token":    token,
		"role":     user.Role,
		"user":     user.ID,
		"username": user.Username,
	})
}

// Guardar respuestas (intentos)

func SaveAttemptAnswers(w http.ResponseWriter, r *http.Request) {
	var answers []AttemptAnswer
	if err := json.NewDecoder(r.Body).Decode(&answers); err != nil {
		http.Error(w, "Solicitud inválida", http.StatusBadRequest)
		return
	}

	log.Printf("📥 Recibido %d respuestas", len(answers))

	var correct, incorrect int
	for _, a := range answers {
		log.Printf("➡️ userID: %d, questionID: %d, selected: %s, correcto: %v",
			a.UserID, a.QuestionID, a.SelectedAnswer, a.IsCorrect)

		_, err := DB.Exec(`
            INSERT INTO attempts (user_id, question_id, selected_answer, is_correct)
            VALUES ($1, $2, $3, $4)`,
			a.UserID, a.QuestionID, a.SelectedAnswer, a.IsCorrect)

		if err != nil {
			log.Println("❌ Error al guardar intento:", err)
			http.Error(w, "Error al guardar el intento", http.StatusInternalServerError)
			return
		}

		if a.IsCorrect {
			correct++
		} else {
			incorrect++
		}
	}

	log.Printf("🧮 Guardando resumen para userID=%d: %d correctos, %d incorrectos", answers[0].UserID, correct, incorrect)

	res, err := DB.Exec(`
		UPDATE attempt_summary SET correct_count = $2, incorrect_count = $3 WHERE user_id = $1`,
		answers[0].UserID, correct, incorrect)
	if err != nil {
		log.Println("❌ Error al actualizar resumen:", err)
		http.Error(w, "Error al guardar resumen", http.StatusInternalServerError)
		return
	}
	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		_, err = DB.Exec(`INSERT INTO attempt_summary (user_id, correct_count, incorrect_count) VALUES ($1, $2, $3)`,
			answers[0].UserID, correct, incorrect)
		if err != nil {
			log.Println("❌ Error al insertar resumen:", err)
			http.Error(w, "Error al guardar resumen", http.StatusInternalServerError)
			return
		}
	}

	// Obtener username para devolver en la respuesta
	var username string
	row := DB.QueryRow(`SELECT username FROM users WHERE id = $1`, answers[0].UserID)
	_ = row.Scan(&username) 

	total := correct + incorrect
	var percentage float64
	if total > 0 {
		percentage = (float64(correct) / float64(total)) * 100
	}

	resp := map[string]interface{}{
		"userId":     answers[0].UserID,
		"username":   username,
		"correct":    correct,
		"incorrect":  incorrect,
		"percentage": fmt.Sprintf("%.2f", percentage),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(resp)
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
	_ = json.Unmarshal(body, &apiResp)

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
			catTraducida = q.Category
		}
		difTraducida := dificultades[q.Difficulty]
		if difTraducida == "" {
			difTraducida = q.Difficulty
		}

		if _, err := DB.Exec(`
            INSERT INTO questions (question, correct_answer, incorrect_answers, categoria, dificultad)
            VALUES ($1, $2, $3, $4, $5)`,
			q.Question, q.CorrectAnswer, pq.Array(q.IncorrectAnswers), catTraducida, difTraducida); err != nil {
			http.Error(w, "Error al guardar pregunta", http.StatusInternalServerError)
			return
		}
	}

	_, _ = w.Write([]byte("Preguntas guardadas exitosamente con traducción al español"))
}

// Obtener preguntas guardadas con filtros
func GetQuestions(w http.ResponseWriter, r *http.Request) {
	categoria := r.URL.Query().Get("categoria")
	dificultad := r.URL.Query().Get("dificultad")

	query := "SELECT id, question, correct_answer, incorrect_answers FROM questions"
	var args []interface{}
	if categoria != "" && dificultad != "" {
		query += " WHERE categoria = $1 AND dificultad = $2"
		args = append(args, categoria, dificultad)
	} else if categoria != "" {
		query += " WHERE categoria = $1"
		args = append(args, categoria)
	} else if dificultad != "" {
		query += " WHERE dificultad = $1"
		args = append(args, dificultad)
	}
	query += " ORDER BY id DESC"

	rows, err := DB.Query(query, args...)
	if err != nil {
		http.Error(w, "Error al obtener preguntas", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var questions []Question
	for rows.Next() {
		var q Question
		if err := rows.Scan(&q.ID, &q.Question, &q.CorrectAnswer, pq.Array(&q.IncorrectAnswers)); err != nil {
			http.Error(w, "Error al procesar pregunta", http.StatusInternalServerError)
			return
		}
		questions = append(questions, q)
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(questions)
}

// Historial global (solo admin)

func GetAttemptsAdmin(w http.ResponseWriter, r *http.Request) {
	// Validar token en el header Authorization
	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		http.Error(w, "Token faltante", http.StatusUnauthorized)
		return
	}
	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

	// Verificar token y extraer claims
	claims, err := VerifyToken(tokenStr)
	if err != nil {
		http.Error(w, "Token inválido", http.StatusUnauthorized)
		return
	}

	// Validar rol admin
	role, ok := claims["role"].(string)
	if !ok || role != "admin" {
		http.Error(w, "No autorizado", http.StatusForbidden)
		return
	}

	// Si el rol es admin, continuar con la consulta
	rows, err := DB.Query(`
		SELECT a.id, a.user_id, q.question, a.selected_answer, a.is_correct, a.answered_at, u.username
		FROM attempts a
		JOIN questions q ON a.question_id = q.id
		JOIN users u ON a.user_id = u.id
		ORDER BY a.answered_at DESC
		LIMIT 50`)
	if err != nil {
		http.Error(w, "Error al obtener intentos", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var attempts []AttemptView
	for rows.Next() {
		var a AttemptView
		var answeredAt time.Time
		if err := rows.Scan(&a.ID, &a.UserID, &a.Question, &a.SelectedAnswer, &a.IsCorrect, &answeredAt, &a.Username); err != nil {
			http.Error(w, "Error al procesar intento", http.StatusInternalServerError)
			return
		}
		a.AnsweredAt = answeredAt.Format(time.RFC3339)
		attempts = append(attempts, a)
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(attempts)
}

func GetUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := DB.Query(`SELECT id, email, username, role FROM users ORDER BY id`)
	if err != nil {
		http.Error(w, "Error al obtener usuarios", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Email, &u.Username, &u.Role); err != nil {
			http.Error(w, "Error al procesar usuario", http.StatusInternalServerError)
			return
		}
		users = append(users, u)
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(users)
}

func CreateUserAdmin(w http.ResponseWriter, r *http.Request) {
	var u User
	if err := json.NewDecoder(r.Body).Decode(&u); err != nil {
		http.Error(w, "Solicitud inválida", http.StatusBadRequest)
		return
	}
	if u.Email == "" || u.Username == "" || u.Password == "" || u.Role == "" {
		http.Error(w, "Email, username, password y role son requeridos", http.StatusBadRequest)
		return
	}
	hashed, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Error al encriptar contraseña", http.StatusInternalServerError)
		return
	}
	if _, err := DB.Exec(`INSERT INTO users (email, username, password, role) VALUES ($1, $2, $3, $4)`, u.Email, u.Username, string(hashed), u.Role); err != nil {
		log.Println("❌ Error al crear usuario admin:", err)
		http.Error(w, "Error al crear usuario", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "Usuario creado"})
}

func UpdateUserRole(w http.ResponseWriter, r *http.Request) {
	// Expecting URL: /admin/users/{id}
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		http.Error(w, "ID de usuario faltante", http.StatusBadRequest)
		return
	}
	id := parts[3]
	var body struct {
		Role string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Solicitud inválida", http.StatusBadRequest)
		return
	}
	if body.Role == "" {
		http.Error(w, "Role requerido", http.StatusBadRequest)
		return
	}
	if _, err := DB.Exec(`UPDATE users SET role = $2 WHERE id = $1`, id, body.Role); err != nil {
		log.Println("❌ Error al actualizar rol:", err)
		http.Error(w, "Error al actualizar rol", http.StatusInternalServerError)
		return
	}
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "Rol actualizado"})
}

func DeleteUser(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		http.Error(w, "ID de usuario faltante", http.StatusBadRequest)
		return
	}
	id := parts[3]
	if _, err := DB.Exec(`DELETE FROM users WHERE id = $1`, id); err != nil {
		log.Println("❌ Error al eliminar usuario:", err)
		http.Error(w, "Error al eliminar usuario", http.StatusInternalServerError)
		return
	}
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "Usuario eliminado"})
}
func GetUserSummary(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		http.Error(w, "Token faltante", http.StatusUnauthorized)
		return
	}
	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
	claims, err := VerifyToken(tokenStr)
	if err != nil {
		http.Error(w, "Token inválido", http.StatusUnauthorized)
		return
	}
	userID, ok := claims["user"].(float64)
	if !ok {
		http.Error(w, "ID inválido", http.StatusBadRequest)
		return
	}

	rows, err := DB.Query(`
        SELECT correct_count, incorrect_count, created_at
        FROM attempt_summary
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 10`, int(userID))
	if err != nil {
		http.Error(w, "Error al obtener resumen", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var summaries []map[string]interface{}
	for rows.Next() {
		var correct, incorrect int
		var createdAt time.Time
		if err := rows.Scan(&correct, &incorrect, &createdAt); err != nil {
			http.Error(w, "Error al procesar resumen", http.StatusInternalServerError)
			return
		}
		summaries = append(summaries, map[string]interface{}{
			"correct":    correct,
			"incorrect":  incorrect,
			"created_at": createdAt.Format(time.RFC3339),
		})
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(summaries)
}
