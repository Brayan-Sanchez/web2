package main

import (
	"database/sql"
	"log"

	_ "github.com/lib/pq"
)

// Variable global para la base de datos
var DB *sql.DB

// Inicializa la conexión a PostgreSQL
func InitDB() {
	connStr := "postgres://postgres:2234@localhost:5432/quizforge_db?sslmode=disable"
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Error al conectar a la base de datos:", err)
	}

	err = db.Ping()
	if err != nil {
		log.Fatal("No se pudo establecer conexión con la base de datos:", err)
	}

	DB = db
	log.Println("Conexión a la base de datos establecida correctamente")
}
