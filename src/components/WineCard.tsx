import { Heart, MapPin } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface WineCardProps {
  id: number;
  title: string;
  country: string;
  wineType: string;
  vintage?: number;
  imageUrl?: string;
  countryFlag?: string;
  isFavorite: boolean;
  grape?: string;
  onToggleFavorite: (id: number) => void;
  onClick: (id: number) => void;
}

export function WineCard({
  id,
  title,
  country,
  wineType,
  vintage,
  imageUrl,
  countryFlag,
  isFavorite,
  grape,
  onToggleFavorite,
  onClick
}: WineCardProps) {
  // Chip do tipo de vinho agora é um componente reutilizável (WineTypeChip)

  return (
    <div
      onClick={() => onClick(id)}
      className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
    >
      <div className="relative h-48 bg-gradient-to-br from-[#4A0D12] to-[#6B0F12]">
        {imageUrl ? (
          <ImageWithFallback
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-32 bg-[#CDA15D]/20 rounded-lg border-2 border-[#CDA15D]" />
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(id);
          }}
          className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow-md hover:bg-white transition-colors"
        >
          <Heart
            className={`w-5 h-5 ${isFavorite ? "fill-[#6B0F12] text-[#6B0F12]" : "text-[#6B6B6B]"}`}
          />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="flex-1 pr-2">{title}</h3>
          {vintage && (
            <span className="text-[#CDA15D] shrink-0">{vintage}</span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3 text-[#6B6B6B]">
          <MapPin className="w-4 h-4" />
          {countryFlag && (
            <img src={countryFlag} alt={country} className="w-5 h-5 rounded-sm" />
          )}
          <span className="text-sm">{country}{grape ? ` · ${grape}` : ''}</span>
        </div>

        <div className="flex gap-2 bg-[#8B0000] rounded-md p-1">
          <WineTypeChip type={wineType} />
        </div>
      </div>
    </div>
  );
}
import { WineTypeChip } from './ui/WineTypeChip';
