-- user_taste_profile.sql
-- Run on your mywine database

USE mywine;

CREATE TABLE IF NOT EXISTS user_taste_profile (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  intensidade ENUM('Leve','Médio','Encorpado') DEFAULT 'Médio',
  estilo JSON DEFAULT (JSON_ARRAY()),
  docura ENUM('Seco','Meio-seco','Doce') DEFAULT 'Seco',
  momentos JSON DEFAULT (JSON_ARRAY()),
  personalidade ENUM('Explorador','Tradicionalista','Estudioso','Social') DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
