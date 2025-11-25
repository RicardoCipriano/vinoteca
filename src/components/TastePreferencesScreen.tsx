import { useEffect, useState } from "react";
import { ArrowLeft, Grape, Sparkles, HeartHandshake } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { api } from "../api/http";
import { toast } from "sonner";

interface TastePreferencesScreenProps {
  onBack: () => void;
}

type Intensidade = "Leve" | "Médio" | "Encorpado" | null;
type Docura = "Seco" | "Meio-seco" | "Doce" | null;

const estilosDisponiveis = ["Tinto", "Branco", "Rosé", "Espumante", "Champagne", "Fortificado"];
const momentosDisponiveis = [
  "Jantar a dois",
  "Confraternização",
  "Relaxar",
  "Comemoração",
  "Degustação",
  "Harmonização"
];
const personalidadesDisponiveis = ["Explorador", "Tradicionalista", "Estudioso", "Social"];

export function TastePreferencesScreen({ onBack }: TastePreferencesScreenProps) {
  const [intensidade, setIntensidade] = useState<Intensidade>(null);
  const [estilo, setEstilo] = useState<string[]>([]);
  const [docura, setDocura] = useState<Docura>(null);
  const [momentos, setMomentos] = useState<string[]>([]);
  const [personalidade, setPersonalidade] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await api.getTasteProfile();
        setIntensidade((p?.intensidade as Intensidade) ?? null);
        setEstilo(Array.isArray(p?.estilo) ? p.estilo : []);
        setDocura((p?.docura as Docura) ?? null);
        setMomentos(Array.isArray(p?.momentos) ? p.momentos : []);
        setPersonalidade((p?.personalidade as string) ?? null);
      } catch {}
    })();
  }, []);

  function toggleFromList(list: string[], value: string, limit?: number) {
    const exists = list.includes(value);
    if (exists) return list.filter(v => v !== value);
    const next = [...list, value];
    if (limit && next.length > limit) return next.slice(0, limit);
    return next;
  }

  async function handleSave() {
    setSaving(true);
    try {
      console.log('[DEBUG] Saving taste profile:', { intensidade, estilo, docura, momentos, personalidade });
      await api.saveTasteProfile({ intensidade, estilo, docura, momentos, personalidade });
      console.log('[DEBUG] Taste profile saved successfully');
      toast.success("Preferências salvas!");
      onBack();
    } catch (e) {
      setSaving(false);
      console.error('[DEBUG] Error saving taste profile:', e);
      toast.error("Falha ao salvar preferências");
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F3EE] pb-20">
      <div className="pt-12 pb-8 px-6 sticky top-0 z-10" style={{ backgroundColor: '#800000' }}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="text-white flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          <h1 className="text-white text-xl">Preferências de Gosto</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="px-6 pt-6 space-y-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-[#4C1C1C] mb-4 flex items-center gap-2"><Grape className="w-5 h-5" /> Intensidade</h2>
          <div className="flex gap-2">
            {["Leve","Médio","Encorpado"].map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setIntensidade(opt as Intensidade)}
                className={`px-4 py-2 rounded-full border transition-all duration-200 ${
                  intensidade === opt 
                    ? 'bg-white text-[#6B0F12] shadow-lg' 
                    : 'bg-white text-[#6B0F12] border-[#C9A646]/40 hover:bg-[#F7EFE6]'
                }`}
                style={intensidade === opt ? { color: '#76c336', borderColor: '#76c336', backgroundColor: '#ffffff' } : undefined}
              >{opt}</button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-[#4C1C1C] mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5" /> Estilo (até 3)</h2>
          <div className="flex flex-wrap gap-2">
            {estilosDisponiveis.map((opt) => {
              const active = estilo.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setEstilo(prev => toggleFromList(prev, opt, 3))}
                className={`px-3 py-2 rounded-full text-sm border transition-all duration-200 ${
                    active 
                      ? 'bg-white text-[#6B0F12] shadow-lg' 
                      : 'bg-white text-[#6B0F12] border-[#C9A646]/40 hover:bg-[#F7EFE6]'
                  }`}
                style={active ? { color: '#76c336', borderColor: '#76c336', backgroundColor: '#ffffff' } : undefined}
                >{opt}</button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-[#4C1C1C] mb-4">Doçura</h2>
          <div className="flex gap-2">
            {["Seco","Meio-seco","Doce"].map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setDocura(opt as Docura)}
                className={`px-4 py-2 rounded-full border transition-all duration-200 ${
                  docura === opt 
                    ? 'bg-white text-[#6B0F12] shadow-lg' 
                    : 'bg-white text-[#6B0F12] border-[#C9A646]/40 hover:bg-[#F7EFE6]'
                }`}
                style={docura === opt ? { color: '#76c336', borderColor: '#76c336', backgroundColor: '#ffffff' } : undefined}
              >{opt}</button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-[#4C1C1C] mb-4">Momentos</h2>
          <div className="grid grid-cols-2 gap-2">
            {momentosDisponiveis.map(opt => {
              const active = momentos.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setMomentos(prev => toggleFromList(prev, opt))}
                className={`px-3 py-2 rounded-xl text-sm border text-left transition-all duration-200 ${
                    active 
                      ? 'bg-white text-[#6B0F12] shadow-lg' 
                      : 'bg-white text-[#6B0F12] border-[#C9A646]/40 hover:bg-[#F7EFE6]'
                  }`}
                style={active ? { color: '#76c336', borderColor: '#76c336', backgroundColor: '#ffffff' } : undefined}
                >{opt}</button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-[#4C1C1C] mb-4 flex items-center gap-2"><HeartHandshake className="w-5 h-5" /> Personalidade</h2>
          <div className="flex flex-wrap gap-2">
            {personalidadesDisponiveis.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setPersonalidade(opt)}
                className={`px-3 py-2 rounded-full text-sm border transition-all duration-200 ${
                  personalidade === opt 
                    ? 'bg-white text-[#6B0F12] shadow-lg' 
                    : 'bg-white text-[#6B0F12] border-[#C9A646]/40 hover:bg-[#F7EFE6]'
                }`}
                style={personalidade === opt ? { color: '#76c336', borderColor: '#76c336', backgroundColor: '#ffffff' } : undefined}
              >{opt}</button>
            ))}
          </div>
        </div>

        <div className="px-6 flex gap-3">
          <Button className="flex-1 bg-white text-[#6B0F12] border border-[#C9A646]/40 hover:bg-[#F7EFE6]" onClick={onBack}>Cancelar</Button>
          <Button disabled={saving} className="flex-1 bg-white text-[#6B0F12] border border-[#C9A646]/40 hover:bg-[#F7EFE6]" onClick={handleSave}>Salvar</Button>
        </div>
      </div>
    </div>
  );
}
