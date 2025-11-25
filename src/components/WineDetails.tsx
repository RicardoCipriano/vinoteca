import { useEffect, useState } from "react";
import { ArrowLeft, Heart, MapPin, Calendar, Edit, Trash2, Share2 } from "lucide-react";
import { WineTypeChip } from './ui/WineTypeChip';
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { api } from "../api/http";

interface WineDetailsProps {
  wineId: number;
  onBack: () => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export function WineDetails({ wineId, onBack, onEdit, onDelete }: WineDetailsProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wine, setWine] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.getWine(wineId);
        if (!mounted) return;
        setWine(data);
        setIsFavorite(Boolean(data?.isFavorite));
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [wineId]);

  const handleShare = async () => {
    try {
      const title = wine?.title || "Meu vinho";
      const text = `${title}${wine?.vintage ? ` (${wine.vintage})` : ''} - ${wine?.country || ''}`.trim();
      const url = window.location.href;
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
        alert("Link copiado para a área de transferência!");
      }
    } catch (_) {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#800000] flex items-center justify-center">
        <p className="text-[#6B6B6B]">Carregando...</p>
      </div>
    );
  }

  if (!wine) {
    return (
      <div className="min-h-screen bg-[#800000] flex items-center justify-center">
        <p className="text-[#6B6B6B]">Vinho não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#800000]">
      {/* Header with Image */}
      <div className="relative h-96 bg-gradient-to-br from-[#4A0D12] to-[#6B0F12]">
        {wine.imageUrl ? (
          <ImageWithFallback
            src={wine.imageUrl}
            alt={wine.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-24 h-48 bg-[#CDA15D]/20 rounded-lg border-4 border-[#CDA15D]" />
          </div>
        )}
        
        {/* Overlay controls */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
          <button onClick={onBack} className="text-white p-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex gap-2">
            <button className="text-white p-2" onClick={handleShare}>
              <Share2 className="w-6 h-6" />
            </button>
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="text-white p-2"
            >
              <Heart className={`w-6 h-6 ${isFavorite ? "fill-white" : ""}`} />
            </button>
          </div>
        </div>
      </div>


      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Title and Type */}
        <div>
          <div className="flex items-start justify-between mb-3">
            <h1 className="flex-1 pr-4 text-white">{wine.title}</h1>
            <WineTypeChip type={String(wine.wineType)} className="shrink-0" />
          </div>
          
          <div className="flex items-center gap-4 text-white">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {wine.countryFlag && (
                <img src={wine.countryFlag} alt={wine.country} className="w-5 h-5 rounded-sm" />
              )}
              <span>{wine.country}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{wine.vintage}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="mb-3 text-[#6B0F12]">Notas de degustação</h3>
          <p className="text-[#6B6B6B] leading-relaxed">{wine.description}</p>
        </div>

        {/* Pairings */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="mb-3 text-[#6B0F12]">Harmonizações</h3>
          <div className="flex flex-wrap gap-2">
            {(wine.pairings || []).map((pairing: string) => (
              <span
                key={pairing}
                className="px-4 py-2 bg-[#F7EFE6] text-[#6B0F12] rounded-full text-sm border border-[#CDA15D]/30"
              >
                {pairing}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="mb-3 text-[#6B0F12]">Fatos sobre o vinho</h3>
          <div className="space-y-2 text-sm">
            <div className="flex">
              <span className="w-32 text-[#6B6B6B]">Vinícola:</span>
              <span className="text-[#4C1C1C]">{wine.wineryName || '-'}</span>
            </div>
          <div className="flex">
            <span className="w-32 text-[#6B6B6B]">Região:</span>
            <span className="text-[#4C1C1C]">{[wine.country, wine.regionName].filter(Boolean).join(' / ') || '-'}</span>
          </div>
          <div className="flex">
            <span className="w-32 text-[#6B6B6B]">Teor alcoólico:</span>
            <span className="text-[#4C1C1C]">{wine.alcoholAbv != null ? `${wine.alcoholAbv}%` : '-'}</span>
          </div>
            <div className="flex items-start">
              <span className="w-32 text-[#6B6B6B]">Descrição do vinho:</span>
              <p className="text-[#6B6B6B] leading-relaxed">{wine.factsDescription || '-'}</p>
            </div>
          </div>
        </div>

      {/* Actions */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          <Button
            onClick={() => onEdit(wine.id)}
            variant="outline"
            className="h-12 border-white text-white hover:bg-white hover:text-[#6B0F12]"
          >
            <Edit className="w-5 h-5 mr-2" />
            Editar
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="h-12 border-white text-white hover:bg-red-600 hover:text-white"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir vinho?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente "{wine.title}" da sua coleção.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(wine.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Added date */}
        <p className="text-center text-white text-sm pt-4">
          Adicionado em {new Date(wine.createdAt).toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>
    </div>
  );
}
