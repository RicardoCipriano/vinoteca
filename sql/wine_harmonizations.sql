-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 25/11/2025 às 19:06
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
-- Estrutura para tabela `wine_harmonizations`
--

CREATE TABLE `wine_harmonizations` (
  `wine_id` bigint(20) UNSIGNED NOT NULL,
  `harmonization_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `wine_harmonizations`
--
ALTER TABLE `wine_harmonizations`
  ADD PRIMARY KEY (`wine_id`,`harmonization_id`),
  ADD KEY `harmonization_id` (`harmonization_id`);

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `wine_harmonizations`
--
ALTER TABLE `wine_harmonizations`
  ADD CONSTRAINT `wine_harmonizations_ibfk_1` FOREIGN KEY (`wine_id`) REFERENCES `wines` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `wine_harmonizations_ibfk_2` FOREIGN KEY (`harmonization_id`) REFERENCES `harmonizations` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
