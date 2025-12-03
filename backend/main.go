package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

func main() {
	InitDB()

	r := mux.NewRouter()

	// Middleware CORS
	r.Use(func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			h.ServeHTTP(w, r)
		})
	})

	// Endpoints
	r.HandleFunc("/questions/fetch", FetchAndSaveQuestions).Methods("GET")
	r.HandleFunc("/questions", GetQuestions).Methods("GET")
	r.HandleFunc("/attempts/answers", SaveAttemptAnswers).Methods("POST")
	r.HandleFunc("/attempts", GetAttempts).Methods("GET")

	log.Println("Servidor corriendo en http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
