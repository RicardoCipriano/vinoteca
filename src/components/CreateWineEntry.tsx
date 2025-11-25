import { useEffect, useState } from "react";
import { ArrowLeft, Camera, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { CameraCapture } from "./CameraCapture";
import { api } from "../api/http";
import Tesseract from "tesseract.js";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";

interface CreateWineEntryProps {
  onSave: () => void;
  onCancel: () => void;
  wineId?: number;
  isEditMode?: boolean;
}

export function CreateWineEntry({ onSave, onCancel, wineId, isEditMode }: CreateWineEntryProps) {
  const USE_SERVER_OCR = (import.meta.env.VITE_USE_SERVER_OCR ?? 'false') === 'true';
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    factsDescription: "",
    country: "",
    wineType: "",
    vintage: "",
    pairings: [] as string[],
    grape: "",
    regionName: "",
    wineryName: "",
    alcoholAbv: ""
  });
  const [harmonizations, setHarmonizations] = useState<string[]>([]);
  type Grape = {
    id?: number;
    name: string;
    tinto?: number | boolean;
    branco?: number | boolean;
    espumante?: number | boolean;
    rose?: number | boolean;
    champagne?: number | boolean;
    intensidade?: 'leve'|'medio'|'encorpado'|null;
  };
  const [grapes, setGrapes] = useState<Grape[]>([]);
  const [ocrSuggestion, setOcrSuggestion] = useState<{ title: string; description: string; vintage?: string } | null>(null);
  const [ocrText, setOcrText] = useState<string>("");
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [ocrOpen, setOcrOpen] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const MIN_OCR_CONFIDENCE = 60; // só sugerir quando confiança for razoável
  const [ocrInfoMessage, setOcrInfoMessage] = useState<string>("");
  

  // Países e tipos (ordenados alfabeticamente para melhor usabilidade)
  const countries = [
    "África do Sul",
    "Alemanha",
    "Argentina",
    "Austrália",
    "Bélgica",
    "Brasil",
    "Bulgária",
    "Cabo Verde",
    "Canadá",
    "Chile",
    "Espanha",
    "Estados Unidos",
    "França",
    "Itália",
    "Portugal",
    "Romênia",
    "Uruguai",
    "Outro"
  ].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));

  const wineTypes = ["branco", "espumante", "champagne", "outro", "rosé", "tinto"].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));

  const pairingsOptions = [
    "Carne vermelha", "Carne branca", "Peixe", "Frutos do mar", "Massa",
    "Queijos", "Sobremesas", "Vegetais", "Comida apimentada"
  ];

  useEffect(() => {
    (async () => {
      try {
        const h = await api.getHarmonizations();
        const names = h.map((x: any) => x.name).sort((a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
        setHarmonizations(names);
      } catch (e) {
        console.error(e);
      }
      try {
        const g = await api.getGrapes();
        const list: Grape[] = (g || []).map((x: any) => ({
          id: x.id,
          name: x.name,
          tinto: x.tinto,
          branco: x.branco,
          espumante: x.espumante,
          rose: x.rose,
          champagne: x.champagne,
          intensidade: x.intensidade ?? null,
        }));
        list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
        setGrapes(list);
      } catch (e) {
        console.error(e);
      }
      // Preencher dados para edição
      if (isEditMode && wineId) {
        try {
          const w = await api.getWine(wineId);
          setFormData({
            title: w.title || "",
            description: w.description || "",
            factsDescription: w.factsDescription || "",
            country: w.country || "",
            wineType: w.wineType || "",
            vintage: w.vintage ? String(w.vintage) : "",
            pairings: Array.isArray(w.pairings) ? w.pairings : [],
            grape: w.grape || "",
            regionName: w.regionName || "",
            wineryName: w.wineryName || "",
            alcoholAbv: w.alcoholAbv != null ? String(w.alcoholAbv) : ""
          });
          if (w.imageUrl) setCapturedImage(w.imageUrl);
        } catch (err) {
          console.error(err);
        }
      }
    })();
  }, [isEditMode, wineId]);

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageUrlToSend = capturedImage;
      if (capturedImage) {
        try {
          // Se for um data URL, fazer upload; se já for URL (/uploads/..), manter
          if (typeof capturedImage === 'string' && capturedImage.startsWith('data:image')) {
            const up = await api.uploadImage(capturedImage);
            imageUrlToSend = up.url;
          }
        } catch (e) {
          console.error(e);
        }
      }
      const payload = {
        title: formData.title,
        description: formData.description,
        country: formData.country,
        wineType: formData.wineType,
        vintage: formData.vintage ? Number(formData.vintage) : undefined,
        pairings: formData.pairings,
        grape: formData.grape,
        imageUrl: imageUrlToSend,
        region_name: formData.regionName?.trim() || undefined,
        regionName: formData.regionName?.trim() || undefined,
        winery_name: formData.wineryName?.trim() || undefined,
        wineryName: formData.wineryName?.trim() || undefined,
        facts_description: formData.factsDescription?.trim() || undefined,
        factsDescription: formData.factsDescription?.trim() || undefined,
        alcohol_abv: formData.alcoholAbv ? Number(formData.alcoholAbv) : undefined,
        alcoholAbv: formData.alcoholAbv ? Number(formData.alcoholAbv) : undefined,
      };
      if (isEditMode && wineId) {
        await api.updateWine(wineId, payload);
      } else {
        await api.createWine(payload);
      }
      onSave();
    } catch (err) {
      alert((err as Error).message || 'Falha ao salvar vinho');
    }
  };

  const preprocessImage = (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const maxWidth = 1024; // reduzir mais a largura para evitar payload grande
          const scale = Math.min(1, maxWidth / img.naturalWidth);
          const targetWidth = Math.round(img.naturalWidth * scale);
          const targetHeight = Math.round(img.naturalHeight * scale);

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(imageUrl);
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          // Converter para escala de cinza e aumentar contraste levemente
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            let v = gray;
            const contrast = 1.15;
            v = (v - 128) * contrast + 128;
            v = Math.max(0, Math.min(255, v));
            data[i] = data[i + 1] = data[i + 2] = v;
          }
          ctx.putImageData(imageData, 0, 0);

          // Exportar como JPEG para reduzir tamanho
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } catch {
          resolve(imageUrl);
        }
      };
      img.onerror = () => resolve(imageUrl);
      img.src = imageUrl;
    });
  };

  const extractVintage = (text: string): string | undefined => {
    const m = text.match(/\b(19|20)\d{2}\b/);
    return m ? m[0] : undefined;
  };

  const filterTechnicalLines = (lines: string[]): string[] => {
    const bad = /(ml|%|alcohol|alcool|sulfites|sulfitos|contém|importado|garrafa|lote|volume|teor|bebida|responsável)/i;
    return lines
      .map(s => s.trim())
      .filter(Boolean)
      .filter(s => s.length >= 3)
      .filter(s => !bad.test(s));
  };

  const sanitizeOcrText = (text: string): string => {
    // Mantém letras latinas com acentos, números e pontuação básica; remove ruídos
    const allowed = /[^A-Za-zÀ-ÖØ-öø-ÿ0-9'&.,;:%\-\/ \n]/gu;
    const cleaned = text.replace(allowed, " ").replace(/\s{2,}/g, " ").trim();
    return cleaned;
  };

  const isMostlyLetters = (s: string): boolean => {
    const letters = (s.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g) || []).length;
    return letters / Math.max(1, s.length) >= 0.5;
  };

  const averageConfidence = (data: any): number | null => {
    try {
      const words = data?.words || [];
      if (!words.length) return data?.confidence ?? null;
      const sum = words.reduce((acc: number, w: any) => acc + (w?.confidence ?? 0), 0);
      return Math.round((sum / words.length) * 100) / 100;
    } catch {
      return null;
    }
  };

  const buildSuggestionFromText = (rawText: string) => {
    const sanitized = sanitizeOcrText(rawText);
    const lines = sanitized.split(/\n+/);
    const filtered = filterTechnicalLines(lines);
    const content = filtered.filter(isMostlyLetters);
    const firstLine = content[0] || '';
    const desc = sanitized.substring(0, 500);
    const vintage = extractVintage(sanitized);
    return { title: firstLine, description: desc, vintage };
  };

  const handleImageCapture = async (imageUrl: string) => {
    setCapturedImage(imageUrl);
    setShowCamera(false);
    try {
      setIsOcrProcessing(true);
      setOcrInfoMessage('Processando OCR, aguarde...');
      const processed = await preprocessImage(imageUrl);
      if (USE_SERVER_OCR) {
        try {
          const resp = await api.ocr(processed);
          const text = (resp?.text || '').trim();
          setOcrText(text);
          const conf = resp?.confidence ?? null;
          setOcrConfidence(conf);
          if (text) {
            const suggestion = resp?.suggestion ?? buildSuggestionFromText(text);
            setOcrSuggestion(suggestion);
            const shouldOpen = (!!suggestion.title && suggestion.title.length >= 3 && (conf ?? MIN_OCR_CONFIDENCE) >= MIN_OCR_CONFIDENCE);
            setOcrOpen(shouldOpen);
            setOcrInfoMessage(shouldOpen ? "" : "OCR com confiança baixa ou texto ilegível. Tente outra foto com mais luz, foco e o rótulo plano.");
          }
        } catch (err) {
          // Fallback automático para OCR no cliente em caso de erro do servidor (ex.: 413)
          console.warn('Falha no OCR do servidor, usando fallback client-side:', err);
          const { data } = await Tesseract.recognize(processed, 'por+eng+fra+ita+spa+deu', { logger: () => {} });
          const text = (data.text || '').trim();
          setOcrText(text);
          const conf = averageConfidence(data);
          setOcrConfidence(conf);
          if (text) {
            const suggestion = buildSuggestionFromText(text);
            setOcrSuggestion(suggestion);
            const shouldOpen = (!!suggestion.title && suggestion.title.length >= 3 && (conf ?? MIN_OCR_CONFIDENCE) >= MIN_OCR_CONFIDENCE);
            setOcrOpen(shouldOpen);
            setOcrInfoMessage(shouldOpen ? "" : "OCR com confiança baixa ou texto ilegível. Tente outra foto com mais luz, foco e o rótulo plano.");
          }
        }
      } else {
        const { data } = await Tesseract.recognize(processed, 'por+eng+fra+ita+spa+deu', { logger: () => {} });
        const text = (data.text || '').trim();
        setOcrText(text);
        const conf = averageConfidence(data);
        setOcrConfidence(conf);
        if (text) {
          const suggestion = buildSuggestionFromText(text);
          setOcrSuggestion(suggestion);
          const shouldOpen = (!!suggestion.title && suggestion.title.length >= 3 && (conf ?? MIN_OCR_CONFIDENCE) >= MIN_OCR_CONFIDENCE);
          setOcrOpen(shouldOpen);
          setOcrInfoMessage(shouldOpen ? "" : "OCR com confiança baixa ou texto ilegível. Tente outra foto com mais luz, foco e o rótulo plano.");
        }
      }

      
    } catch {
      setOcrSuggestion(null);
      setOcrOpen(false);
      setOcrInfoMessage("Falha ao processar OCR. Tente novamente ou preencha manualmente.");
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const togglePairing = (pairing: string) => {
    setFormData(prev => ({
      ...prev,
      pairings: prev.pairings.includes(pairing)
        ? prev.pairings.filter(p => p !== pairing)
        : [...prev.pairings, pairing]
    }));
  };

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handleImageCapture}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  

  return (
    <div className="min-h-screen bg-[#F7EFE6] pb-8">
      {/* Header */}
      <div className="pt-12 pb-6 px-6 sticky top-0 z-10" style={{ backgroundImage: `url('/image/depositphotos_127000384-stock-photo-bottle-and-glass-of-red.jpg')`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={onCancel} className="text-[#CDA15D] flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Cancelar
          </button>
          <h1 className="text-[#F7EFE6] text-xl">{isEditMode ? 'Editar Vinho' : 'Adicionar Vinho'}</h1>
          <div className="w-16" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 pt-6 space-y-6">
        <AlertDialog open={ocrOpen} onOpenChange={setOcrOpen}>
          <AlertDialogContent className="max-w-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Sugestões do OCR</AlertDialogTitle>
              <AlertDialogDescription>
                {ocrConfidence !== null ? `Confiança média: ${ocrConfidence.toFixed(1)}%` : 'Confiança indisponível'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3 text-sm">
              {ocrSuggestion && (
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold">Nome sugerido:</span> {ocrSuggestion.title || '(vazio)'}
                  </div>
                  
                  {ocrSuggestion.vintage && (
                    <div>
                      <span className="font-semibold">Safra detectada:</span> {ocrSuggestion.vintage}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold">Texto extraído:</span>
                    <div className="mt-1 max-h-40 overflow-auto p-2 bg-[#F7EFE6] rounded">{ocrText}</div>
                  </div>
                </div>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setOcrSuggestion(null)}>Descartar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (!ocrSuggestion) return;
                  setFormData(prev => ({
                    ...prev,
                    title: prev.title || ocrSuggestion.title || prev.title,
                    description: prev.description || ocrSuggestion.description || prev.description,
                    vintage: prev.vintage || (ocrSuggestion.vintage ? String(ocrSuggestion.vintage) : prev.vintage)
                  }));
                  setOcrOpen(false);
                }}
              >
                Aplicar sugestões
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {/* Image Upload */}
        <div>
          <Label className="mb-2 block">Foto do rótulo (câmera OCR)</Label>
          {capturedImage ? (
            <div className="relative">
              <img
                src={capturedImage}
                alt="Rótulo do vinho"
                className="w-full max-h-56 object-contain rounded-xl bg-white"
              />
              <button
                type="button"
                onClick={() => setCapturedImage(null)}
                className="absolute top-2 right-2 bg-white/90 p-2 rounded-full"
              >
                <X className="w-5 h-5 text-[#6B0F12]" />
              </button>
              {isOcrProcessing && (
                <p className="text-[#6B0F12] text-sm mt-2">Processando OCR, aguarde...</p>
              )}
              {ocrConfidence !== null && ocrConfidence < MIN_OCR_CONFIDENCE && (
                <p className="text-[#6B0F12] text-sm mt-2">{ocrInfoMessage || `OCR com confiança baixa (${ocrConfidence.toFixed(1)}%). Tente novamente com melhor iluminação, foco e enquadramento do texto.`}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="w-full h-56 border-2 border-dashed border-[#CDA15D] rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-white/50 transition-colors bg-white"
              >
                <Camera className="w-12 h-12 text-[#6B0F12]" />
                <span className="text-[#6B6B6B]">Toque para capturar o rótulo (OCR)</span>
              </button>
              <div className="flex justify-center">
                <label className="text-[#6B0F12] cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const dataUrl = reader.result as string;
                        handleImageCapture(dataUrl);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <span className="underline">Ou enviar imagem da galeria</span>
                </label>
              </div>
              
            </div>
          )}
        </div>

        {/* Wine Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Nome do vinho *</Label>
          <Input
            id="title"
            placeholder="ex.: Château Margaux 2015"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="border-[#CDA15D]/30 focus:border-[#6B0F12]"
            required
          />
        </div>


        {/* Country and Type */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>País *</Label>
            <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
              <SelectTrigger className="border-[#CDA15D]/30">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {countries.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={formData.wineType} onValueChange={(value) => {
              // Ao mudar o tipo, limpar uva se não compatível
              setFormData(prev => ({ ...prev, wineType: value, grape: '' }));
            }}>
              <SelectTrigger className="border-[#CDA15D]/30">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {wineTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>


        {/* Grape (Uva) selection */}
        <div className="space-y-2">
          <Label>Uva</Label>
          <Select value={formData.grape} onValueChange={(value) => setFormData({ ...formData, grape: value })}>
            <SelectTrigger className="border-[#CDA15D]/30">
              <SelectValue placeholder="Selecione a uva" />
            </SelectTrigger>
            <SelectContent>
              {(() => {
                const type = (formData.wineType || '').toLowerCase();
                let filtered = grapes;
                if (type === 'branco') {
                  filtered = grapes.filter(g => (g.branco === 1 || g.branco === true));
                } else if (type === 'tinto') {
                  filtered = grapes.filter(g => (g.tinto === 1 || g.tinto === true));
                } else if (type === 'rosé') {
                  filtered = grapes.filter(g => (g.rose === 1 || g.rose === true));
                }
                const labelFromIntensity = (i?: Grape['intensidade']) => {
                  if (!i) return '';
                  if (i === 'leve') return 'Leve';
                  if (i === 'medio') return 'Médio';
                  if (i === 'encorpado') return 'Encorpado';
                  return '';
                };
                return filtered.map((g) => {
                  const intensityLabel = labelFromIntensity(g.intensidade);
                  const show = intensityLabel ? `${g.name} — ${intensityLabel}` : g.name;
                  return (
                    <SelectItem key={g.name} value={g.name}>{show}</SelectItem>
                  );
                });
              })()}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vintage">Safra (ano)</Label>
          <Input
            id="vintage"
            type="number"
            placeholder="2020"
            value={formData.vintage}
            onChange={(e) => setFormData({ ...formData, vintage: e.target.value })}
            className="border-[#CDA15D]/30 focus:border-[#6B0F12]"
          />
        </div>

        {!isEditMode && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vinícola</Label>
                <Input
                  id="wineryName"
                  placeholder="ex.: Château Margaux"
                  value={formData.wineryName}
                  onChange={(e) => setFormData({ ...formData, wineryName: e.target.value })}
                  className="border-[#CDA15D]/30 focus:border-[#6B0F12]"
                />
              </div>
              <div className="space-y-2">
                <Label>Região</Label>
                <Input
                  id="regionName"
                  placeholder="ex.: Bordeaux, Serra Gaúcha"
                  value={formData.regionName}
                  onChange={(e) => setFormData({ ...formData, regionName: e.target.value })}
                  className="border-[#CDA15D]/30 focus:border-[#6B0F12]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teor alcoólico (%)</Label>
                <Input
                  id="alcohol"
                  placeholder="ex.: 13.5"
                  value={formData.alcoholAbv}
                  onChange={(e) => setFormData({ ...formData, alcoholAbv: e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.') })}
                  className="border-[#CDA15D]/30 focus:border-[#6B0F12]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="factsDescription">Descrição do vinho (máx. 300 caracteres)</Label>
                <Textarea
                  id="factsDescription"
                  placeholder="Descreva aroma, sabor e suas impressões..."
                  value={formData.factsDescription}
                  onChange={(e) => setFormData({ ...formData, factsDescription: e.target.value.slice(0, 300) })}
                  maxLength={300}
                  className="border-[#CDA15D]/30 focus:border-[#6B0F12] min-h-24"
                />
                <div className="text-center text-xs text-[#6B6B6B]">{formData.factsDescription.length}/300</div>
              </div>
            </div>
          </div>
        )}

        {/* Pairings (Harmonizações do banco) */}
        <div className="space-y-3">
          <Label>Harmonizações</Label>
          <div className="flex flex-wrap gap-2">
            {harmonizations.map(pairing => (
              <button
                key={pairing}
                type="button"
                onClick={() => togglePairing(pairing)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  formData.pairings.includes(pairing)
                    ? "bg-[#6B0F12] text-white"
                    : "bg-white text-[#6B6B6B] border border-[#CDA15D]/30"
                }`}
              >
                {pairing}
              </button>
            ))}
          </div>
        </div>

        {isEditMode && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="mb-3 text-[#6B0F12]">Notas de degustação</h3>
            <div className="space-y-2">
              <Label htmlFor="tastingNotes">Notas de degustação</Label>
              <Textarea
                id="tastingNotes"
                placeholder="Aromas, sabores, sensações..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border-[#CDA15D]/30 focus:border-[#6B0F12] min-h-24"
              />
            </div>
          </div>
        )}

        {isEditMode && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="mb-3 text-[#6B0F12]">Fatos sobre o vinho</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vinícola</Label>
                  <Input
                    id="wineryName"
                    placeholder="ex.: Château Margaux"
                    value={formData.wineryName}
                    onChange={(e) => setFormData({ ...formData, wineryName: e.target.value })}
                    className="border-[#CDA15D]/30 focus:border-[#6B0F12]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Região</Label>
                  <Input
                    id="regionName"
                    placeholder="ex.: Bordeaux, Serra Gaúcha"
                    value={formData.regionName}
                    onChange={(e) => setFormData({ ...formData, regionName: e.target.value })}
                    className="border-[#CDA15D]/30 focus:border-[#6B0F12]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Teor alcoólico (%)</Label>
                  <Input
                    id="alcohol"
                    placeholder="ex.: 13.5"
                    value={formData.alcoholAbv}
                    onChange={(e) => setFormData({ ...formData, alcoholAbv: e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.') })}
                    className="border-[#CDA15D]/30 focus:border-[#6B0F12]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="factsDescription">Descrição do vinho (máx. 300 caracteres)</Label>
                  <Textarea
                    id="factsDescription"
                    placeholder="Descreva aroma, sabor e suas impressões..."
                    value={formData.factsDescription}
                    onChange={(e) => setFormData({ ...formData, factsDescription: e.target.value.slice(0, 300) })}
                    maxLength={300}
                    className="border-[#CDA15D]/30 focus:border-[#6B0F12] min-h-24"
                  />
                  <div className="text-right text-xs text-[#6B6B6B]">{formData.factsDescription.length}/300</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-[#6B0F12] hover:bg-[#4A0D12] text-white h-12"
        >
          Salvar vinho
        </Button>
      </form>
    </div>
  );
}
