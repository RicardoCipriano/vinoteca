-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 21/11/2025 às 23:21
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
-- Estrutura para tabela `wineries`
--

CREATE TABLE `wineries` (
  `id` int(10) UNSIGNED NOT NULL,
  `country_id` int(10) UNSIGNED NOT NULL,
  `region_id` int(10) UNSIGNED DEFAULT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `wineries`
--

INSERT INTO `wineries` (`id`, `country_id`, `region_id`, `name`) VALUES
(3, 1, 3, 'Chandon Brasil'),
(1, 3, 1, 'Château Margaux'),
(2, 3, 2, 'Moët & Chandon'),
(13, 3, 13, 'Chateo'),
(4, 7, 4, 'Catena Zapata'),
(14, 8, NULL, 'Alto Chile');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `wineries`
--
ALTER TABLE `wineries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_winery_country_region` (`country_id`,`region_id`,`name`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `wineries`
--
ALTER TABLE `wineries`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
