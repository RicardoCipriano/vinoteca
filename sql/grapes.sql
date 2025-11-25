-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 21/11/2025 às 22:45
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
-- Estrutura para tabela `grapes`
--

CREATE TABLE `grapes` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `tinto` tinyint(1) NOT NULL DEFAULT 0,
  `branco` tinyint(1) NOT NULL DEFAULT 0,
  `intensidade` enum('leve','medio','encorpado') DEFAULT NULL,
  `espumante` tinyint(1) NOT NULL DEFAULT 0,
  `rose` tinyint(1) NOT NULL DEFAULT 0,
  `champagne` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `grapes`
--

INSERT INTO `grapes` (`id`, `name`, `tinto`, `branco`, `intensidade`, `espumante`, `rose`, `champagne`) VALUES
(1, 'Cabernet Sauvignon', 1, 0, 'encorpado', 0, 1, 0),
(2, 'Merlot', 1, 0, 'medio', 0, 1, 0),
(3, 'Malbec', 1, 0, 'encorpado', 0, 1, 0),
(4, 'Pinot Noir', 1, 0, 'leve', 0, 1, 0),
(5, 'Syrah', 1, 0, 'encorpado', 0, 1, 0),
(6, 'Chardonnay', 0, 1, 'encorpado', 0, 0, 0),
(7, 'Sauvignon Blanc', 0, 1, 'leve', 0, 0, 0),
(8, 'Tempranillo', 1, 0, 'encorpado', 0, 1, 0),
(9, 'Sangiovese', 1, 0, 'medio', 0, 1, 0),
(10, 'Riesling', 0, 1, 'medio', 0, 0, 0),
(11, 'Torrontés', 0, 1, 'leve', 0, 0, 0),
(12, 'Carmenère', 1, 0, 'medio', 0, 0, 0),
(13, 'Tannat', 1, 0, 'encorpado', 0, 0, 0),
(14, 'Zinfandel', 1, 0, 'medio', 0, 0, 0),
(15, 'Nebbiolo', 1, 0, NULL, 0, 0, 0),
(16, 'Viognier', 0, 1, 'encorpado', 0, 0, 0),
(145, 'Pinot Grigio', 0, 1, 'leve', 0, 0, 0),
(147, 'Verdejo', 0, 1, 'leve', 0, 0, 0),
(148, 'Moscato', 0, 1, 'leve', 0, 0, 0),
(150, 'Grüner Veltliner', 0, 1, 'leve', 0, 0, 0),
(151, 'Albariño', 0, 1, 'medio', 0, 0, 0),
(152, 'Fiano', 0, 1, 'medio', 0, 0, 0),
(153, 'Chenin Blanc', 0, 1, 'medio', 0, 0, 0),
(155, 'Garganega', 0, 1, 'encorpado', 0, 0, 0),
(156, 'Sémillon', 0, 1, 'encorpado', 0, 0, 0),
(157, 'Gewürztraminer', 0, 1, 'encorpado', 0, 0, 0),
(159, 'Roussanne', 0, 1, 'encorpado', 0, 0, 0),
(193, 'Gamay', 1, 0, 'leve', 0, 0, 0),
(195, 'Garnacha', 1, 0, 'medio', 0, 1, 0),
(196, 'Valpolicella', 1, 0, 'medio', 0, 0, 0),
(199, 'Cabernet Franc', 1, 0, 'medio', 0, 0, 0),
(207, 'Pinotage', 1, 0, 'encorpado', 0, 0, 0);

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `grapes`
--
ALTER TABLE `grapes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `grapes`
--
ALTER TABLE `grapes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2225;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
