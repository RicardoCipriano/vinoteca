import { useEffect, useRef, useState } from "react";
import { ArrowLeft, SunMoon, Palette, Grape, Pencil, Check, FileText, Trash2, Trophy, Globe } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { api, API_URL } from "../api/http";
import { toast } from "sonner";

interface AccountSettingsScreenProps {
  onBack: () => void;
}

export function AccountSettingsScreen({ onBack }: AccountSettingsScreenProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState("pt-BR");
  const [theme, setTheme] = useState("system");
  const [receiveMarketing, setReceiveMarketing] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [notifyLabels, setNotifyLabels] = useState(true);
  const [notifyHarmonizations, setNotifyHarmonizations] = useState(true);
  const [notifyEvents, setNotifyEvents] = useState(false);
  const [notifyAchievements, setNotifyAchievements] = useState(true);
  const [level, setLevel] = useState<string | null>(null);
  const [levelScore, setLevelScore] = useState(0);
  const [levelSuggestions, setLevelSuggestions] = useState<string[]>([]);
  const [progress, setProgress] = useState(45);
  const [profileVisibility, setProfileVisibility] = useState("public");
  const [darkMode, setDarkMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [privacyText, setPrivacyText] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const POLICY_TEXT = `POLÍTICA DE PRIVACIDADE – VinoTeca Última atualização: 17/11/2025 

A presente Política de Privacidade descreve como o aplicativo VinoTeca 
coleta, utiliza, armazena e protege os dados pessoais de seus usuários, 
em conformidade com a Lei Geral de Proteção de Dados (LGPD – Lei nº 
13.709/2018).

1.  Informações que Coletamos

-   Dados de cadastro (nome, e-mail, senha criptografada, país, idioma, 
    foto de perfil)
-   Dados de uso (vinhos cadastrados, favoritos, notas, preferências)
-   Dados de câmera (imagens de rótulos para identificação)
-   Dados técnicos (modelo do dispositivo, logs, sistema operacional)

2.  Como Utilizamos os Dados

-   Criar e manter a conta do usuário
-   Personalizar recomendações
-   Identificar rótulos via câmera
-   Melhorar recursos e estabilidade do app
-   Enviar comunicações essenciais
-   Garantir segurança e prevenção a fraudes

3.  Compartilhamento de Dados

-   Parceiros e fornecedores essenciais
-   Cumprimento de obrigações legais
-   Mediante consentimento do usuário

4.  Armazenamento e Segurança

-   Criptografia de senhas
-   Conexões seguras
-   Monitoramento de acesso
-   Armazenamento seguro no Brasil ou exterior

5.  Direitos do Usuário

-   Acessar, corrigir ou excluir dados
-   Portabilidade
-   Revogação de consentimento
-   Solicitação via e-mail [rc77.rc91@gmail.com]

6.  Exclusão da Conta Os dados serão removidos, exceto informações 
    necessárias ao cumprimento legal.

7.  Uso da Câmera Utilizada apenas para captura de rótulos. Não 
    realizamos reconhecimento facial.

8.  Cookies e Rastreamento Utilizamos identificadores anônimos para 
    melhorar a experiência e performance.

9.  Alterações nesta Política A política pode ser atualizada. 
    Notificaremos mudanças relevantes pelo app.

10. Contato Para dúvidas ou solicitações relacionadas à privacidade: 
    [rc77.rc91@gmail.com]

11. Aceite dos Termos Ao usar o VinoTeca, o usuário concorda com esta 
    Política de Privacidade.`;

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getAccount();
        setName(data?.name || "");
        setEmail(data?.email || "");
        setAvatarUrl(data?.avatar || data?.avatar_url || null);
        setCountry(data?.country || "");
        setLanguage(data?.language || "pt-BR");
        setTheme(data?.theme || "system");
        setReceiveMarketing(!!data?.receive_marketing);
        setTwoFactorEnabled(!!data?.two_factor_enabled);
        setLevel(data?.level || "Curioso");
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.getMe();
        setLevel(me?.level ?? null);
      } catch {}
    })();
  }, []);

  const handleSelectAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = String(reader.result || "");
      if (!dataUrl.startsWith("data:image")) return;
      try {
        const up = await api.uploadImage(dataUrl);
        const rel = up?.url || "";
        const full = `${API_URL}${rel}`;
        setAvatarUrl(full);
        try {
          await api.saveAccount({ avatar: full, avatar_url: full });
          toast.success("Foto atualizada");
        } catch {}
      } catch {}
    };
    reader.readAsDataURL(file);
  };

  const handleSaveName = async () => {
    try {
      await api.saveAccount({ name });
      setEditingName(false);
      toast.success("Nome atualizado");
    } catch {
      toast.error("Falha ao atualizar nome");
    }
  };

  const handleSaveEmail = async () => {
    try {
      await api.saveAccount({ email });
      setEditingEmail(false);
      toast.success("Email atualizado");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao atualizar email");
    }
  };

  const openPrivacy = async () => {
    try {
      const res = await api.getPrivacyPolicy();
      setPrivacyText(String(res?.content || POLICY_TEXT));
      setPrivacyOpen(true);
    } catch {
      setPrivacyText(POLICY_TEXT);
      setPrivacyOpen(true);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.deleteAccount();
      toast.success("Conta excluída");
      try { localStorage.removeItem("token"); } catch {}
      onBack();
    } catch (e: any) {
      toast.error(e?.message || "Falha ao excluir conta");
    }
  };

  const handleSave = async () => {
    await api.saveAccount({
      name,
      avatar_url: avatarUrl,
      country,
      language,
      theme,
      receive_marketing: receiveMarketing,
      two_factor_enabled: twoFactorEnabled,
    });
    onBack();
  };

  return (
    <div className="min-h-screen bg-[#F7F3EE] pb-20">
      <div className="pt-12 pb-8 px-6 sticky top-0 z-10" style={{ backgroundColor: '#800000' }}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="text-white flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          <h1 className="text-white text-xl">Configurações da Conta</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="px-6 pt-6 space-y-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-4 border-[#C9A646]">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={name || "Perfil"} />}
              <AvatarFallback className="bg-[#C9A646] text-[#4C1C1C]">{name?.trim() ? name.trim().split(" ").map(p => p[0]).slice(0,2).join("") : "US"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <Label>Nome</Label>
                {editingName ? (
                  <Button size="sm" onClick={handleSaveName} className="bg-[#4C1C1C] hover:bg-[#6B0F12] text-white"><Check className="w-4 h-4 mr-1" /> Salvar</Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setEditingName(true)} className="border-[#C9A646] text-[#4C1C1C]"><Pencil className="w-4 h-4 mr-1" /> Editar</Button>
                )}
              </div>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" disabled={!editingName} />
              <div className="mt-3 flex items-center justify-between">
                <Label>Email</Label>
                {editingEmail ? (
                  <Button size="sm" onClick={handleSaveEmail} className="bg-[#4C1C1C] hover:bg-[#6B0F12] text-white"><Check className="w-4 h-4 mr-1" /> Salvar</Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setEditingEmail(true)} className="border-[#C9A646] text-[#4C1C1C]"><Pencil className="w-4 h-4 mr-1" /> Editar</Button>
                )}
              </div>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" disabled={!editingEmail} />
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => fileInputRef.current?.click()} className="bg-[#C9A646] text-[#1B1B1B]">Alterar foto</Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleSelectAvatar} />
            </div>
          </div>
        </div>


        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-[#4C1C1C] mb-4 flex items-center gap-2"><Trophy className="w-5 h-5" /> Nível Enófilo</h2>
          {level ? (
            <>
              <div className="flex items-center gap-3">
                <div className="text-[#6B0F12] font-semibold">{level}</div>
                <div className="flex-1 h-3 rounded-full bg-[#F7EFE6]">
                  <div className="h-3 rounded-full" style={{ width: `${Math.min(100, Math.round((levelScore/30)*100))}%`, background: "linear-gradient(90deg, #C9A646, #4C1C1C)" }} />
                </div>
              </div>
              <div className="mt-3 text-[#6B6B6B]">Sugestões para evoluir:</div>
              <ul className="mt-2 space-y-1">
                {levelSuggestions.map((s, i) => (
                  <li key={i} className="text-[#6B6B6B] text-sm">• {s}</li>
                ))}
              </ul>
            </>
          ) : (
            <div className="text-[#6B6B6B]">Cadastre vinhos na sua coleção para receber seu nível enófilo.</div>
          )}
        </div>


        

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-[#4C1C1C] mb-4 flex items-center gap-2"><Globe className="w-5 h-5" /> Ajuda e Suporte</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button variant="outline" onClick={openPrivacy} className="border-[#C9A646] text-[#4C1C1C]">Política de Privacidade</Button>
            <Button variant="outline" onClick={() => setConfirmOpen(true)} className="border-[#C9A646] text-[#4C1C1C] flex items-center gap-2"><Trash2 className="w-4 h-4" /> Excluir conta</Button>
          </div>
        </div>

      <div className="px-6 flex gap-3">
        <Button className="flex-1 bg-white text-[#6B0F12] border border-[#C9A646]/40 hover:bg-[#F7EFE6]" onClick={onBack}>Cancelar</Button>
        <Button className="flex-1 bg-white text-[#6B0F12] border border-[#C9A646]/40 hover:bg-[#F7EFE6]" onClick={handleSave}>Salvar</Button>
      </div>
        <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Política de Privacidade</DialogTitle>
              <DialogDescription>Leia atentamente os termos de privacidade da VinoTeca.</DialogDescription>
            </DialogHeader>
            <div className="text-[#4C1C1C] whitespace-pre-wrap text-sm">{privacyText || ""}</div>
          </DialogContent>
        </Dialog>
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
              <DialogDescription>Esta ação é permanente e não pode ser desfeita.</DialogDescription>
            </DialogHeader>
            <div className="text-[#4C1C1C] text-sm">Tem certeza que deseja excluir sua conta? Esta ação é permanente e removerá todos os seus dados.</div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" className="border-[#C9A646] text-[#4C1C1C]" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
              <Button className="bg-[#4C1C1C] hover:bg-[#6B0F12] text-white" onClick={() => { setConfirmOpen(false); handleDeleteAccount(); }}>Excluir</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
