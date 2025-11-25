import React from 'react';

type Props = {
  type: string;
  className?: string;
};

const normalizeType = (type?: string) => {
  const raw = (type || '').toLowerCase().trim();
  if (!raw) return 'outro';
  const has = (s: string) => raw.includes(s);

  // Mapeia variações e plurais
  if (has('champ')) return 'champagne'; // champagne, champanhe
  if (has('espum')) return 'espumante'; // espumante, espumantes
  if (has('spark')) return 'espumante'; // sparkling
  if (has('rosé') || has('rose') || has('rosê') || has('rosad')) return 'rosé'; // rosé, rose, rosê, rosado
  if (has('branc') || raw === 'white') return 'branco';
  if (has('tint') || raw === 'red') return 'tinto';
  return 'outro';
};

const bgMap: Record<string, string> = {
  tinto: 'bg-[#6B0F12]',
  branco: 'bg-[#F7EFE6] border border-[#CDA15D]',
  rosé: 'bg-[#F7EFE6] border border-[#CDA15D]',
  espumante: 'bg-[#F7EFE6] border border-[#CDA15D]',
  champagne: 'bg-[#F7EFE6] border border-[#CDA15D]',
  fortificado: 'bg-[#F7EFE6] border border-[#CDA15D]',
  outro: 'bg-[#F7EFE6] border border-[#CDA15D]'
};

export function WineTypeChip({ type, className }: Props) {
  const key = normalizeType(type);
  const bgClass = bgMap[key] || bgMap.outro;
  const textClass = (
    key === 'branco' ||
    key === 'champagne' ||
    key === 'rosé' ||
    key === 'espumante' ||
    key === 'fortificado' ||
    key === 'outro'
  )
    ? 'text-[#6B0F12]'
    : 'text-white';
  const label = key === 'rosé'
    ? 'Rosé'
    : key.charAt(0).toUpperCase() + key.slice(1);

  return (
    <span className={`px-3 py-1 rounded-full text-xs ${bgClass} ${textClass} ${className ?? ''}`}>
      {label}
    </span>
  );
}

export default WineTypeChip;