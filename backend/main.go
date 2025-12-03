package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

func main() {
	InitDB()

	r := mux.NewRouter()

	// Middleware CORS + Authorization
	r.Use(func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			h.ServeHTTP(w, r)
		})
	})

	// 🔓 Rutas públicas
	r.HandleFunc("/register", RegisterHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/login", LoginHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/questions/fetch", FetchAndSaveQuestions).Methods("GET", "OPTIONS")
	r.HandleFunc("/questions", GetQuestions).Methods("GET", "OPTIONS")
	r.HandleFunc("/attempts/answers", SaveAttemptAnswers).Methods("POST", "OPTIONS")
	r.HandleFunc("/user/resumen", AuthMiddleware(GetUserSummary, "user")).Methods("GET", "OPTIONS")

	// Admin user management
	r.HandleFunc("/admin/users", AuthMiddleware(GetUsers, "admin")).Methods("GET", "OPTIONS")
	r.HandleFunc("/admin/users", AuthMiddleware(CreateUserAdmin, "admin")).Methods("POST", "OPTIONS")
	r.HandleFunc("/admin/users/{id}", AuthMiddleware(UpdateUserRole, "admin")).Methods("PUT", "PATCH", "OPTIONS")
	r.HandleFunc("/admin/users/{id}", AuthMiddleware(DeleteUser, "admin")).Methods("DELETE", "OPTIONS")

	// 🔐 Rutas protegidas
	r.HandleFunc("/admin/historial", AuthMiddleware(GetAttemptsAdmin, "admin")).Methods("GET", "OPTIONS")
	r.HandleFunc("/user/historial", AuthMiddleware(GetUserAttempts, "user")).Methods("GET", "OPTIONS") // ✅ nueva

	log.Println("✅ Servidor corriendo en http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
