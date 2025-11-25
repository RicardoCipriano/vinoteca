import { useState } from "react";
import { Wine, User, Mail, Lock, Eye, EyeOff, ArrowLeft, FileText, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { api } from "../api/http";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface RegisterScreenProps {
  onRegister: () => void;
  onNavigateToLogin: () => void;
}

export function RegisterScreen({ onRegister, onNavigateToLogin }: RegisterScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("As senhas não conferem");
      return;
    }
    if (!acceptTerms) {
      alert("Você precisa aceitar os termos para criar a conta");
      setPolicyOpen(true);
      return;
    }
    try {
      const { token } = await api.register(formData.name, formData.email, formData.password, true, '2025-11-17');
      localStorage.setItem("token", token);
      onRegister();
    } catch (err) {
      alert((err as Error).message || "Falha no cadastro");
    }
  };

  return (
    <div className="min-h-screen bg-[#800000] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#4A0D12] to-[#6B0F12] pt-12 pb-20 px-6">
        <button
          onClick={onNavigateToLogin}
          className="text-[#CDA15D] mb-6 flex items-center gap-2 hover:text-[#F7EFE6]"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
        <div className="text-center">
          <Wine className="w-16 h-16 text-[#CDA15D] mx-auto mb-4" strokeWidth={1.5} />
          <h1 className="text-[#F7EFE6] text-3xl mb-2">Criar conta</h1>
          <p className="text-[#CDA15D]">Comece sua jornada do vinho</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="flex-1 -mt-12 px-6 pb-8">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6B6B]" />
                <Input
                  id="name"
                  type="text"
                  placeholder="João Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-11 border-[#CDA15D]/30 focus:border-[#6B0F12]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6B6B]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-11 border-[#CDA15D]/30 focus:border-[#6B0F12]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6B6B]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-11 pr-11 border-[#CDA15D]/30 focus:border-[#6B0F12]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6B6B]" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="pl-11 pr-11 border-[#CDA15D]/30 focus:border-[#6B0F12]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#6B0F12] hover:bg-[#4A0D12] text-[#F7EFE6] h-12"
            >
              Criar conta
            </Button>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setPolicyOpen(true)} className="text-[#6B0F12] flex items-center gap-2"><FileText className="w-4 h-4" /> Ver Política de Privacidade</button>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
                Aceito a Política de Privacidade
              </label>
            </div>
          </form>
        </div>
      </div>
      <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Política de Privacidade</DialogTitle>
          </DialogHeader>
          <div className="text-[#4C1C1C] whitespace-pre-wrap text-sm mb-4">{POLICY_TEXT}</div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" className="border-[#C9A646] text-[#4C1C1C]" onClick={() => setPolicyOpen(false)}>Fechar</Button>
            <Button className="bg-[#4C1C1C] hover:bg-[#6B0F12] text-white" onClick={() => { setAcceptTerms(true); setPolicyOpen(false); }}><Check className="w-4 h-4 mr-1" /> Aceitar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
