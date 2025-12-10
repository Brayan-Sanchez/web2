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
			origin := r.Header.Get("Origin")
			if origin == "" {
				origin = "*"
			}
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Max-Age", "86400")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			h.ServeHTTP(w, r)
		})
	})

	//  Rutas públicas
	r.HandleFunc("/register", RegisterHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/login", LoginHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/questions/fetch", FetchAndSaveQuestions).Methods("GET", "OPTIONS")
	r.HandleFunc("/questions", GetQuestions).Methods("GET", "OPTIONS")
	r.HandleFunc("/attempts/answers", SaveAttemptAnswers).Methods("POST", "OPTIONS")
	r.HandleFunc("/user/resumen", AuthMiddleware(GetUserSummary, "user")).Methods("GET", "OPTIONS")

	r.HandleFunc("/admin/users", AuthMiddleware(GetUsers, "admin")).Methods("GET", "OPTIONS")
	r.HandleFunc("/admin/users", AuthMiddleware(CreateUserAdmin, "admin")).Methods("POST", "OPTIONS")
	r.HandleFunc("/admin/users/{id}", AuthMiddleware(UpdateUserRole, "admin")).Methods("PUT", "PATCH", "OPTIONS")
	r.HandleFunc("/admin/users/{id}", AuthMiddleware(DeleteUser, "admin")).Methods("DELETE", "OPTIONS")

	//  Rutas protegidas
	r.HandleFunc("/admin/historial", AuthMiddleware(GetAttemptsAdmin, "admin")).Methods("GET", "OPTIONS")
	r.HandleFunc("/user/historial", AuthMiddleware(GetUserAttempts, "user")).Methods("GET", "OPTIONS") // ✅ nueva

	log.Println("✅ Servidor corriendo en http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
