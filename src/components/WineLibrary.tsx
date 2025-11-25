import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, Plus, Heart } from "lucide-react";
import headerImage from "../../image/81X+In40YCL._AC_UF894,1000_QL80_.jpg";
import { WineCard } from "./WineCard";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { api } from "../api/http";

interface Wine {
  id: number;
  title: string;
  country: string;
  wineType: string;
  vintage?: number;
  imageUrl?: string;
  countryFlag?: string;
  isFavorite: boolean;
  description?: string;
  grape?: string;
}

interface WineLibraryProps {
  onNavigateToCreate: () => void;
  onNavigateToDetails: (id: number) => void;
}

export function WineLibrary({ onNavigateToCreate, onNavigateToDetails }: WineLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState("all");
  const [wines, setWines] = useState<Wine[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getWines();
        setWines(data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const handleToggleFavorite = async (id: number) => {
    try {
      const { isFavorite } = await api.toggleFavorite(id);
      setWines(wines.map(w => (w.id === id ? { ...w, isFavorite } : w)));
    } catch (err) {
      console.error(err);
    }
  };

  // Normaliza texto removendo acentos e deixando minúsculo
  const normalize = (value?: string | number) => {
    const str = (value ?? '').toString();
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };

  const filteredWines = wines.filter(wine => {
    const q = normalize(searchQuery);
    const matchesSearch = (
      normalize(wine.title).includes(q) ||
      normalize(wine.country).includes(q) ||
      normalize(wine.wineType).includes(q) ||
      normalize(wine.grape).includes(q) ||
      normalize(wine.description).includes(q)
    );
    const matchesFilter = filterTab === "all" || 
                         (filterTab === "favorites" && wine.isFavorite) ||
                         (filterTab !== "all" && filterTab !== "favorites" && wine.wineType === filterTab);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#800000] pb-24">
      {/* Header */}
      <div className="pt-12 pb-8 px-6" style={{ backgroundImage: `url(${headerImage})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[#F7EFE6] text-3xl mb-1">Minha coleção</h1>
            <p className="text-[#CDA15D]">{wines.length} vinhos</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white" />
          <Input
            type="search"
            placeholder="Buscar vinhos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 bg-white border-none text-white placeholder:text-white"
          />
        </div>
      </div>

      {/* Filter buttons below search: 3 on first row, rest on second row */}
      <div className="px-6 mt-3 mb-4">
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'favorites', label: 'Favoritos', icon: Heart },
            { key: 'tinto', label: 'Tinto' },
            { key: 'branco', label: 'Branco' },
          ].map(item => {
            const active = filterTab === item.key;
            const Icon = item.icon;
            const bg = item.key === 'all' ? 'bg-[#F1F5F9]'
              : item.key === 'favorites' ? 'bg-[#FDEAD8]'
              : item.key === 'tinto' ? 'bg-[#F4E1E1]'
              : item.key === 'branco' ? 'bg-[#EEF7FF]'
              : item.key === 'rose' ? 'bg-[#FFE4EC]'
              : item.key === 'espumante' ? 'bg-[#E8F9F0]'
              : 'bg-[#FFF4D6]';
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilterTab(item.key as any)}
                className={`px-3 py-1 rounded-full text-sm border transition-all ${
                  active
                    ? 'bg-white text-[#76c336] border-[#76c336] shadow-lg'
                    : `${bg} text-white border-[#CDA15D]/40 hover:opacity-90`
                } flex items-center gap-1`}
              >
                {Icon ? <Icon className="w-4 h-4" /> : null}
                {item.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 mt-2">
          {[
            { key: 'rose', label: 'Rosé' },
            { key: 'espumante', label: 'Espumante' },
            { key: 'champagne', label: 'Champagne' },
          ].map(item => {
            const active = filterTab === item.key;
            const bg = item.key === 'rose' ? 'bg-[#FFE4EC]'
              : item.key === 'espumante' ? 'bg-[#E8F9F0]'
              : 'bg-[#FFF4D6]';
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilterTab(item.key as any)}
                className={`px-3 py-1 rounded-full text-sm border transition-all ${
                  active
                    ? 'bg-white text-[#76c336] border-[#76c336] shadow-lg'
                    : `${bg} text-white border-[#CDA15D]/40 hover:opacity-90`
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Wine Grid */}
      <div className="px-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredWines.map(wine => (
          <WineCard
            key={wine.id}
            {...wine}
            onToggleFavorite={handleToggleFavorite}
            onClick={onNavigateToDetails}
          />
        ))}
      </div>

      {filteredWines.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#6B6B6B]">Nenhum vinho encontrado</p>
        </div>
      )}

      {/* Floating Add Button */}
      <Button
        onClick={onNavigateToCreate}
        className="fixed bottom-20 right-6 w-14 h-14 rounded-full bg-[#6B0F12] hover:bg-[#4A0D12] shadow-xl"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}
