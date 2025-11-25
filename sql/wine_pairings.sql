-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 21/11/2025 às 21:42
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
-- Estrutura para tabela `wine_pairings`
--

CREATE TABLE `wine_pairings` (
  `id` int(10) UNSIGNED NOT NULL,
  `wine_id` int(10) UNSIGNED NOT NULL,
  `pairing` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `wine_pairings`
--

INSERT INTO `wine_pairings` (`id`, `wine_id`, `pairing`) VALUES
(3, 4, 'Carnes vermelhas'),
(6, 7, 'Churrasco'),
(13, 11, 'Peixe'),
(21, 9, 'Vegetais'),
(22, 12, 'Comida mediterrânea'),
(24, 13, 'Comida asiática (não japonesa)'),
(25, 14, 'Queijos'),
(27, 10, 'Doces e tortas'),
(28, 8, 'Frutos do mar'),
(30, 16, 'Aves'),
(31, 16, 'Frutos do mar'),
(32, 15, 'Carne branca'),
(41, 17, 'Queijos'),
(42, 17, 'Peixe'),
(64, 18, 'Chocolate'),
(65, 18, 'Comida asiática (não japonesa)'),
(66, 18, 'Sopas e caldos'),
(67, 6, 'Carnes vermelhas'),
(68, 6, 'Charcutaria'),
(69, 6, 'Churrasco');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `wine_pairings`
--
ALTER TABLE `wine_pairings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `wine_id` (`wine_id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `wine_pairings`
--
ALTER TABLE `wine_pairings`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
