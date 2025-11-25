import { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { api } from "../api/http";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface LoginScreenProps {
  onLogin: () => void;
  onNavigateToRegister: () => void;
}

export function LoginScreen({ onLogin, onNavigateToRegister }: LoginScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [apiOnline, setApiOnline] = useState(true);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetCode, setResetCode] = useState("");
  const [newPasswordReset, setNewPasswordReset] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { token } = await api.login(email, password);
      localStorage.setItem("token", token);
      onLogin();
    } catch (err) {
      alert((err as Error).message || "Falha no login");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${api.API_URL}/health`);
        setApiOnline(res.ok);
      } catch {
        setApiOnline(false);
      }
    })();
  }, []);

  const handleRequestReset = async () => {
    setResetError(null);
    setResetLoading(true);
    try {
      await api.requestPasswordReset(resetEmail);
      alert("Enviamos um código para o seu email");
      setResetStep(2);
    } catch (e: any) {
      setResetError(e?.message || "Falha ao enviar código");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setResetError(null);
    setResetLoading(true);
    try {
      await api.resetPassword(resetEmail, resetCode, newPasswordReset);
      alert("Senha redefinida com sucesso");
      setResetOpen(false);
      setResetStep(1);
      setResetEmail("");
      setResetCode("");
      setNewPasswordReset("");
    } catch (e: any) {
      setResetError(e?.message || "Falha ao redefinir senha");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#800000] flex flex-col">
      {/* Header */}
      <div className="pt-12 pb-20 px-6 text-center" style={{ backgroundColor: '#800000' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExb293cDc1eG5oZ2NncGZ4MHBkNG51YWZuYTBmN3NsZzJkY3Zwc2R1ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/h8seX8nSq9spN7MMKK/giphy.gif" alt="Taça" className="w-16 h-16 object-contain" />
          <h1 style={{ color: '#e4c0a8', fontSize: 'calc(1.05 * 1.875rem)' }} className="uppercase font-bold text-3xl">VINOTECA</h1>
          <img src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExb293cDc1eG5oZ2NncGZ4MHBkNG51YWZuYTBmN3NsZzJkY3Zwc2R1ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/h8seX8nSq9spN7MMKK/giphy.gif" alt="Taça" className="w-16 h-16 object-contain" />
        </div>
        <p className="text-white">Acesse sua coleção de vinhos</p>
      </div>

      {/* Form Card */}
      <div className="flex-1 -mt-12 px-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          {!apiOnline && (
            <div className="mb-4 p-3 rounded-md bg-[#FFF3CD] text-[#856404] border border-[#FFEEBA]">
              Serviço da API indisponível em {api.API_URL}. Inicie o servidor e tente novamente.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6B6B]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <button
              type="button"
              onClick={() => {
                setResetOpen(true);
                setResetStep(1);
                setResetEmail(email || "");
                setResetCode("");
                setNewPasswordReset("");
                setResetError(null);
                setResetSentCode(null);
              }}
              className="text-[#6B0F12] text-sm hover:underline"
              disabled={!apiOnline}
            >
              Esqueceu a senha?
            </button>

            <Button
              type="submit"
              className="w-full bg-[#6B0F12] hover:bg-[#4A0D12] text-[#F7EFE6] h-12"
              disabled={!apiOnline}
            >
              Entrar
            </Button>
          </form>
        </div>

        <div className="text-center">
          <p className="text-white">
            Não tem uma conta?{" "}
            <button onClick={onNavigateToRegister} className="text-white hover:underline">
              Crie uma agora
            </button>
          </p>
        </div>

        <Dialog open={resetOpen} onOpenChange={setResetOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Recuperar senha</DialogTitle>
            </DialogHeader>
            {resetStep === 1 ? (
              <div className="space-y-3">
                <Label htmlFor="resetEmail">Email</Label>
                <Input id="resetEmail" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
                <Button onClick={handleRequestReset} disabled={resetLoading} className="bg-[#6B0F12] hover:bg-[#4A0D12] text-white">
                  Enviar código
                </Button>
                {resetError && <p className="text-red-600 text-sm">{resetError}</p>}
              </div>
            ) : (
              <div className="space-y-3">
                <Label htmlFor="resetCode">Código recebido</Label>
                <Input id="resetCode" value={resetCode} onChange={(e) => setResetCode(e.target.value)} />
                <Label htmlFor="resetNew">Nova senha</Label>
                <Input id="resetNew" type="password" value={newPasswordReset} onChange={(e) => setNewPasswordReset(e.target.value)} />
                <Button onClick={handleResetPassword} disabled={resetLoading} className="bg-[#6B0F12] hover:bg-[#4A0D12] text-white">
                  Redefinir senha
                </Button>
                {resetError && <p className="text-red-600 text-sm">{resetError}</p>}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
