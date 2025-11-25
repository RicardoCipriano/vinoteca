-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 21/11/2025 às 22:40
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
-- Estrutura para tabela `harmonizations`
--

CREATE TABLE `harmonizations` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `harmonizations`
--

INSERT INTO `harmonizations` (`id`, `name`) VALUES
(7, 'Aves'),
(102, 'Carne branca'),
(109, 'Carne Suína'),
(101, 'Carne vermelha'),
(1, 'Carnes vermelhas'),
(15, 'Charcuteria e Queijo'),
(19, 'Chocolate'),
(5, 'Churrasco'),
(559, 'Comida apimentada'),
(26, 'Comida asiática (não japonesa)'),
(12, 'Comida indiana'),
(9, 'Comida japonesa / sushi'),
(13, 'Comida mediterrânea'),
(11, 'Comida mexicana'),
(28, 'Doces e tortas'),
(10, 'Frutos do mar'),
(105, 'Lasanha'),
(555, 'Massa'),
(4, 'Massas'),
(22, 'Massas leves (molhos brancos delicados)'),
(23, 'Massas pesadas (ragù, bolonhesa)'),
(103, 'Peixe'),
(3, 'Peixes'),
(14, 'Pizzas'),
(25, 'Pratos defumados'),
(8, 'Pratos picantes'),
(2, 'Queijos'),
(21, 'Queijos azuis'),
(24, 'Risotos'),
(16, 'Saladas'),
(6, 'Sobremesas'),
(27, 'Sobremesas com creme'),
(20, 'Sobremesas de frutas'),
(17, 'Sopas e caldos'),
(108, 'Vegetais'),
(18, 'Vegetarianos / veganos');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `harmonizations`
--
ALTER TABLE `harmonizations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `harmonizations`
--
ALTER TABLE `harmonizations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=614;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
