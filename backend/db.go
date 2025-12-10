package main

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func InitDB() {
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		connStr = "postgres://postgres:2234@localhost:5432/quizforge_db?sslmode=disable"
	}

	var err error
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("❌ Error al conectar a la base de datos:", err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatal("❌ No se pudo establecer conexión con la base de datos:", err)
	}

	log.Println("✅ Conexión a la base de datos establecida correctamente")

	createTables()
}

func createTables() {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        );`,
		`CREATE TABLE IF NOT EXISTS questions (
            id SERIAL PRIMARY KEY,
            question TEXT NOT NULL,
            correct_answer TEXT NOT NULL,
            incorrect_answers TEXT[] NOT NULL,
            categoria TEXT,
            dificultad TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`,
		`CREATE TABLE IF NOT EXISTS attempts (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            question_id INTEGER REFERENCES questions(id),
            selected_answer TEXT,
            is_correct BOOLEAN,
            answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`,
		`CREATE TABLE IF NOT EXISTS attempt_summary (
			id SERIAL PRIMARY KEY,
			user_id INTEGER UNIQUE REFERENCES users(id),
			correct_count INTEGER DEFAULT 0,
			incorrect_count INTEGER DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);`,
	}

	for _, q := range queries {
		if _, err := DB.Exec(q); err != nil {
			log.Fatal("❌ Error al crear tablas:", err)
		}
	}

	if _, err := DB.Exec(`ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT`); err != nil {
		log.Println("⚠️ No se pudo asegurar columna username:", err)
	}

	log.Println("✅ Tablas creadas/verificadas correctamente")
}
