-- user_account_settings.sql
-- Run on your mywine database

USE mywine;

CREATE TABLE IF NOT EXISTS user_account_settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  avatar_url VARCHAR(1024) DEFAULT NULL,
  country VARCHAR(100) DEFAULT NULL,
  language VARCHAR(10) DEFAULT 'pt-BR',
  theme ENUM('system','light','dark') DEFAULT 'system',
  receive_marketing TINYINT(1) DEFAULT 0,
  two_factor_enabled TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
