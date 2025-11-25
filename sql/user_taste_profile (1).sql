-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 21/11/2025 às 23:19
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `mywine`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `user_taste_profile`
--

CREATE TABLE `user_taste_profile` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `intensidade` enum('Leve','Médio','Encorpado') DEFAULT 'Médio',
  `estilo` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`estilo`)),
  `docura` enum('Seco','Meio-seco','Doce') DEFAULT 'Seco',
  `momentos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`momentos`)),
  `personalidade` enum('Explorador','Tradicionalista','Estudioso','Social') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `user_taste_profile`
--

INSERT INTO `user_taste_profile` (`id`, `user_id`, `intensidade`, `estilo`, `docura`, `momentos`, `personalidade`, `created_at`, `updated_at`) VALUES
(1, 1, 'Leve', '[\"Fortificado\",\"Champagne\"]', 'Doce', '[\"Jantar a dois\",\"Harmonização\"]', 'Social', '2025-11-13 03:16:42', '2025-11-13 05:15:23'),
(2, 2, 'Leve', '[]', 'Doce', '[]', '', '2025-11-13 05:11:11', '2025-11-13 05:11:11');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `user_taste_profile`
--
ALTER TABLE `user_taste_profile`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `ux_user_taste_user` (`user_id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `user_taste_profile`
--
ALTER TABLE `user_taste_profile`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `user_taste_profile`
--
ALTER TABLE `user_taste_profile`
  ADD CONSTRAINT `fk_user_taste_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
