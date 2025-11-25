import { User, Wine, Heart, MapPin, Settings, LogOut, ChevronRight, Camera, Trophy, FileText } from "lucide-react";
import { AlertDialog, AlertDialogContent } from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { useEffect, useMemo, useRef, useState } from "react";
import { api, API_URL } from "../api/http";

interface ProfileScreenProps {
  onLogout: () => void;
  onOpenSettings?: () => void;
  onOpenPreferences?: () => void;
  refreshKey?: number;
}

export function ProfileScreen({ onLogout, onOpenSettings, onOpenPreferences, refreshKey }: ProfileScreenProps) {
  const [userName, setUserName] = useState<string>("—");
  const [userEmail, setUserEmail] = useState<string>("—");
  const [wines, setWines] = useState<any[]>([]);
  const [summaryCounts, setSummaryCounts] = useState<{
    tinto: number; branco: number; rose: number; espumante: number; champagne: number; outro: number;
  } | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [tasteProfile, setTasteProfile] = useState<{ intensidade: string | null; docura: string | null; estilo: string[]; } | null>(null);
  const [recommendations, setRecommendations] = useState<{ grapes: string[]; recommendedWines: any[] } | null>(null);
  const [userLevel, setUserLevel] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.getMe();
        setUserName(me.name || "—");
        setUserEmail(me.email || "—");
        if (me.avatar) setProfileImageUrl(me.avatar);
        setUserLevel(me.level || null);
      } catch (e) {
        console.error(e);
      }
      try {
        const list = await api.getWines();
        setWines(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
      }
      try {
        const res = await api.getWineSummary();
        const counts = res?.counts;
        if (counts && typeof counts === 'object') {
          setSummaryCounts({
            tinto: Number(counts.tinto) || 0,
            branco: Number(counts.branco) || 0,
            rose: Number(counts.rose) || 0,
            espumante: Number(counts.espumante) || 0,
            champagne: Number(counts.champagne) || 0,
            outro: Number(counts.outro) || 0,
          });
        }
      } catch (e) {
        console.error(e);
      }
      try {
        console.log('[DEBUG] Loading taste profile...');
        const taste = await api.getTasteProfile();
        console.log('[DEBUG] Taste profile received:', taste);
        console.log('[DEBUG] Estilo type:', typeof taste?.estilo);
        console.log('[DEBUG] Estilo value:', taste?.estilo);
        console.log('[DEBUG] Estilo is array:', Array.isArray(taste?.estilo));
        console.log('[DEBUG] Estilo length:', taste?.estilo?.length);
        setTasteProfile({ intensidade: taste?.intensidade ?? null, docura: taste?.docura ?? null, estilo: Array.isArray(taste?.estilo) ? taste.estilo : [] });
      } catch (e) {
        console.error('[DEBUG] Error loading taste profile:', e);
      }
      try {
        console.log('[DEBUG] Loading recommendations...');
        const rec = await api.getRecommendations();
        console.log('[DEBUG] Recommendations received:', rec);
        setRecommendations({ grapes: Array.isArray(rec?.grapes) ? rec.grapes : [], recommendedWines: Array.isArray(rec?.recommendedWines) ? rec.recommendedWines : [] });
      } catch (e) {
        console.error('[DEBUG] Error loading recommendations:', e);
      }
      try {
        const me2 = await api.getMe();
        setUserLevel(me2?.level || null);
      } catch {}
      try {
        const acc = await api.getAccount();
        const url = acc?.avatar || acc?.avatar_url || null;
        if (!profileImageUrl && url) setProfileImageUrl(url);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [refreshKey]);

  // Fallback: calcula nível localmente quando o backend ainda não forneceu
  useEffect(() => {
    if (userLevel) return;
    const count = wines.length;
    if (count <= 1) {
      setUserLevel(null);
      return;
    }
    const normalizeType = (raw?: string) => {
      const s = (raw || '').toLowerCase().trim();
      if (!s) return 'outro';
      const plain = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const has = (q: string) => plain.includes(q);
      if (has('champ')) return 'champagne';
      if (has('espum') || has('spark')) return 'espumante';
      if (has('rose') || has('rosad')) return 'rose';
      if (has('branc') || plain === 'white') return 'branco';
      if (has('tint') || plain === 'red') return 'tinto';
      if (has('fortific')) return 'champagne';
      return 'outro';
    };
    const types = new Set<string>();
    wines.forEach(w => types.add(normalizeType((w as any).wine_type || (w as any).wineType)));
    const uniqueTypes = types.size;
    const score = count + uniqueTypes * 2;
    let computed: string = 'Iniciante';
    if (score >= 30) computed = 'Expert';
    else if (score >= 15) computed = 'Sommelier';
    else if (score >= 5) computed = 'Curioso';
    setUserLevel(computed);
  }, [wines, summaryCounts, userLevel]);

  // Load saved profile image (persist in localStorage)
  useEffect(() => {
    const saved = localStorage.getItem('profileImageUrl');
    if (saved) setProfileImageUrl(saved);
  }, []);

  async function handleProfileImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl.startsWith('data:image')) return;
      try {
        const res = await api.uploadImage(dataUrl);
        const relativeUrl = res?.url || '';
        const fullUrl = `${API_URL}${relativeUrl}`;
        setProfileImageUrl(fullUrl);
        localStorage.setItem('profileImageUrl', fullUrl);
        try {
          await api.saveAccount({ avatar_url: fullUrl });
        } catch {}
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
  }

  const totalWines = wines.length;
  const favorites = wines.filter(w => w.isFavorite === true || w.isFavorite === 1).length;
  const countries = useMemo(() => {
    const set = new Set<string>();
    wines.forEach(w => { if (w.country) set.add(w.country); });
    return set.size;
  }, [wines]);

  const stats = [
    { label: "Vinhos", value: totalWines, icon: Wine },
    { label: "Favoritos", value: favorites, icon: Heart },
    { label: "Países", value: countries, icon: MapPin }
  ];

  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const menuItems = [
    { label: "Configurações da conta", icon: Settings, action: () => onOpenSettings && onOpenSettings() },
    { label: "Preferências", icon: User, action: () => onOpenPreferences && onOpenPreferences() },
    { label: "Banco de Dados", icon: FileText, action: () => window.dispatchEvent(new CustomEvent("nav:database")) },
    { label: "Sobre", icon: Wine, action: () => setIsAboutOpen(true) }
  ];

  return (
    <div className="min-h-screen bg-[#F7EFE6] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#4A0D12] to-[#6B0F12] pt-12 pb-20 px-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Avatar className="w-24 h-24 border-4 border-[#CDA15D]">
            {profileImageUrl && (
              <AvatarImage src={profileImageUrl} alt={userName || 'Perfil'} />
            )}
            <AvatarFallback className="bg-[#CDA15D] text-[#4A0D12] text-2xl">
              {userName?.trim() ? userName.trim().split(" ").map(p => p[0]).slice(0,2).join("") : "US"}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full bg-[#CDA15D] text-[#4A0D12] hover:bg-[#B8924F] shadow"
            aria-label="Alterar foto do perfil"
            title="Alterar foto do perfil"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleProfileImageSelected}
          />
        </div>
        <h1 className="text-[#F7EFE6] text-2xl mb-1">{userName || "Usuário"}</h1>
        <p className="text-[#CDA15D]">{userEmail || "email@exemplo.com"}</p>
        {userLevel && (
          <div className="mt-2 flex items-center justify-center">
            <span className="inline-flex items-center gap-2 bg-[#4A0D12]/40 text-[#F7EFE6] px-3 py-1 rounded-full">
              <Trophy className="w-4 h-4" />
              Nível Enófilo: {userLevel}
            </span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="px-6 -mt-12 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-4 shadow-lg text-center">
              <stat.icon className="w-6 h-6 text-[#6B0F12] mx-auto mb-2" />
              <div className="text-2xl text-[#6B0F12] mb-1">{stat.value}</div>
              <div className="text-xs text-[#6B6B6B]">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Collection Breakdown */}
      <div className="px-6 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="mb-4 text-[#6B0F12]">Resumo da coleção</h3>
          <div className="space-y-3">
            {(() => {
              // Usa resumo do backend quando disponível; senão, faz a normalização local
              let counts: Record<string, number> = summaryCounts || {};
              if (!summaryCounts) {
                const normalizeType = (raw?: string) => {
                  const s = (raw || '').toLowerCase().trim();
                  if (!s) return 'outro';
                  const plain = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                  const has = (q: string) => plain.includes(q);
                  if (has('champ')) return 'champagne';
                  if (has('espum') || has('spark')) return 'espumante';
                  if (has('rose') || has('rosad')) return 'rose';
                  if (has('branc') || plain === 'white') return 'branco';
                  if (has('tint') || plain === 'red') return 'tinto';
                  if (has('fortific')) return 'champagne';
                  return 'outro';
                };
                const groups: Record<string, number> = {};
                wines.forEach(w => {
                  const key = normalizeType(w.wineType || (w as any).wine_type);
                  groups[key] = (groups[key] || 0) + 1;
                });
                counts = groups;
              }

              const items = [
                { type: 'Tinto', key: 'tinto', color: '#6B0F12' },
                { type: 'Branco', key: 'branco', color: '#F7EFE6' },
                // normaliza chave 'rose' para rótulo 'Rosé'
                { type: 'Rosé', key: 'rose', color: '#8B3A62' },
                { type: 'Espumante', key: 'espumante', color: '#2F4858' },
                { type: 'Champagne', key: 'champagne', color: '#8A6D3B' },
                { type: 'Outro', key: 'outro', color: '#6B6B6B' },
              ];

              return items
                .map(item => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: item.color, borderColor: item.color }}
                      />
                      <span className="text-[#6B6B6B]">{item.type}</span>
                    </div>
                    <span className="text-[#6B0F12]">{counts[item.key] || 0}</span>
                  </div>
                ));
            })()}
          </div>
        </div>
      </div>

      {/* Taste Preferences Summary */}
      <div className="px-6 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="mb-4 text-[#6B0F12]">Preferências</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#6B6B6B]">Intensidade</span>
              <span className="text-[#6B0F12]">{tasteProfile?.intensidade || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B6B6B]">Doçura</span>
              <span className="text-[#6B0F12]">{tasteProfile?.docura || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B6B6B]">Estilos</span>
              <span className="text-[#6B0F12]">{
                (() => {
                  const estiloArray = tasteProfile?.estilo;
                  console.log('[DEBUG] Display - estiloArray:', estiloArray);
                  console.log('[DEBUG] Display - estiloArray type:', typeof estiloArray);
                  
                  // Handle null/undefined case
                  if (!estiloArray) {
                    console.log('[DEBUG] Display - no estiloArray, returning em dash');
                    return '—';
                  }
                  
                  console.log('[DEBUG] Display - estiloArray length:', estiloArray.length);
                  const joined = estiloArray.slice(0,3).join(', ');
                  console.log('[DEBUG] Display - joined:', joined);
                  
                  // Return empty string for empty arrays, joined string for data
                  return joined;
                })()
              }</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="px-6 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="mb-4 text-[#6B0F12]">Recomendações</h3>
          <div className="space-y-3">
            <div>
              <div className="text-[#6B6B6B] mb-1">Uvas sugeridas</div>
              <div className="flex flex-wrap gap-2">
                {(recommendations?.grapes || []).slice(0, 8).map((g) => (
                  <span key={g} className="px-3 py-1 rounded-full text-sm bg-[#F7EFE6] text-[#6B0F12] border border-[#CDA15D]/50">{g}</span>
                ))}
                {(recommendations?.grapes || []).length === 0 && (
                  <span className="text-[#6B6B6B] text-sm">—</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-[#6B6B6B] mb-1">Da sua coleção</div>
              <div className="space-y-2">
                {(recommendations?.recommendedWines || []).slice(0, 5).map((w) => (
                  <div key={w.id} className="flex items-center justify-between">
                    <div className="text-[#6B0F12]">{w.title}</div>
                    <div className="text-xs text-[#6B6B6B]">{w.country} · {w.wineType}{w.vintage ? ` · ${w.vintage}` : ''}</div>
                  </div>
                ))}
                {(recommendations?.recommendedWines || []).length === 0 && (
                  <div className="text-[#6B6B6B] text-sm">Sem itens correspondentes na coleção</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico do cliente */}
      <div className="px-6 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="mb-4 text-[#6B0F12]">Histórico do cliente</h3>
          <div className="space-y-3">
            {wines.slice(0, 5).map((w) => (
              <div key={w.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wine className="w-4 h-4 text-[#6B0F12]" />
                  <div>
                    <div className="text-[#6B0F12]">{w.title}</div>
                    <div className="text-xs text-[#6B6B6B]">
                      {(w.country || '—')} · {(w.wineType || '—')}{w.vintage ? ` · ${w.vintage}` : ''}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-[#6B6B6B]">
                  {w.createdAt ? new Date(w.createdAt).toLocaleDateString('pt-BR') : ''}
                </div>
              </div>
            ))}
            {wines.length === 0 && (
              <div className="text-[#6B6B6B] text-sm">Sem registros ainda. Adicione seus primeiros vinhos!</div>
            )}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {menuItems.map((item, index) => (
            <div key={item.label}>
              <button
                onClick={item.action}
                className="w-full flex items-center justify-between p-4 hover:bg-[#F7EFE6] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-[#6B0F12]" />
                  <span className="text-[#6B6B6B]">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-[#6B6B6B]" />
              </button>
              {index < menuItems.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </div>

      {/* Logout Button */}
      <div className="px-6">
        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full h-12 border-[#6B0F12] text-[#6B0F12] hover:bg-[#6B0F12]/10 hover:text-[#6B0F12] bg-transparent"
        >
          <LogOut className="w-5 h-5 mr-2 text-[#6B0F12]" />
          Sair
        </Button>
      </div>

      {/* Sobre Modal */}
      <AlertDialog open={isAboutOpen} onOpenChange={setIsAboutOpen}>
        <AlertDialogContent className="p-0 overflow-hidden rounded-xl">
          <div className="relative min-h-[50vh]">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/image/fundo1.jfif)" }} />
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative p-6 text-white">
              <h2 className="text-3xl md:text-4xl font-extrabold">Vinoteca...</h2>
              <p className="mt-4 text-sm md:text-base font-bold">
                Mergulhe no universo fascinante dos vinhos com o Vinoteca, seu sommelier digital de bolso. Explore rótulos, descubra novas uvas, acompanhe sua coleção e aprenda sobre intensidades, aromas e harmonizações de forma visual e interativa. Seja você um apreciador iniciante ou um enófilo experiente, o Vinoteca transforma cada taça em uma experiência única — conectando tecnologia, elegância e paixão pelo vinho.
              </p>
              <p className="mt-4 text-sm md:text-base font-bold">Developed by RCSoluções</p>
              <p className="text-sm md:text-base font-bold">Inovando com sabor, tecnologia e inspiração. 🍇</p>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setIsAboutOpen(false)} className="bg-[#6B0F12] hover:bg-[#4A0D12]">Fechar</Button>
              </div>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
