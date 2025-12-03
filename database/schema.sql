-- Schema SQL para QuizForge
-- Tablas: users, questions, attempts, attempt_summary

-- Usuarios
CREATE TABLE IF NOT EXISTS users (
	id SERIAL PRIMARY KEY,
	email TEXT UNIQUE NOT NULL,
	password TEXT NOT NULL,
	username TEXT,
	role TEXT NOT NULL DEFAULT 'user',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Preguntas
CREATE TABLE IF NOT EXISTS questions (
	id SERIAL PRIMARY KEY,
	question TEXT NOT NULL,
	correct_answer TEXT NOT NULL,
	incorrect_answers TEXT[] NOT NULL,
	categoria TEXT,
	dificultad TEXT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Intentos individuales
CREATE TABLE IF NOT EXISTS attempts (
	id SERIAL PRIMARY KEY,
	user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
	question_id INTEGER REFERENCES questions(id) ON DELETE SET NULL,
	selected_answer TEXT,
	is_correct BOOLEAN,
	answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_question ON attempts(question_id);

-- Resumen por usuario (un registro por user_id)
CREATE TABLE IF NOT EXISTS attempt_summary (
	id SERIAL PRIMARY KEY,
	user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
	correct_count INTEGER DEFAULT 0,
	incorrect_count INTEGER DEFAULT 0,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

