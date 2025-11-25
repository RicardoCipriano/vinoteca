import { useState, useEffect } from "react";
import { api } from "./api/http";
import { SplashScreen } from "./components/SplashScreen";
import { LoginScreen } from "./components/LoginScreen";
import { RegisterScreen } from "./components/RegisterScreen";
import { WineLibrary } from "./components/WineLibrary";
import { CreateWineEntry } from "./components/CreateWineEntry";
import { WineDetails } from "./components/WineDetails";
import { ProfileScreen } from "./components/ProfileScreen";
import { ScalePage } from "./components/ScalePage";
import { BottomNavigation } from "./components/BottomNavigation";
import { AccountSettingsScreen } from "./components/AccountSettingsScreen";
import { TastePreferencesScreen } from "./components/TastePreferencesScreen";
import { DatabaseScreen } from "./components/DatabaseScreen";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";

type Screen = 
  | "splash" 
  | "login" 
  | "register" 
  | "library" 
  | "create" 
  | "details" 
  | "profile"
  | "favorites"
  | "scale"
  | "settings"
  | "preferences"
  | "database";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("splash");
  const [selectedWineId, setSelectedWineId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("library");
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);

  useEffect(() => {
    // Auto-dismiss splash after mount
    const timer = setTimeout(() => {
      setCurrentScreen("login");
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handler = () => setCurrentScreen("database");
    window.addEventListener("nav:database", handler as EventListener);
    return () => window.removeEventListener("nav:database", handler as EventListener);
  }, []);

  const handleLogin = () => {
    setCurrentScreen("library");
    setActiveTab("library");
    toast.success("Bem Vindo de volta!", { className: "text-white" });
  };

  const handleRegister = () => {
    setCurrentScreen("library");
    setActiveTab("library");
    toast.success("Conta criada com sucesso!", { className: "text-white" });
  };

  const handleLogout = () => {
    setCurrentScreen("login");
    setActiveTab("library");
    toast.success("Sessão encerrada com sucesso", { className: "text-white" });
  };

  const [isEditMode, setIsEditMode] = useState(false);

  const handleNavigateToCreate = () => {
    setCurrentScreen("create");
  };

  const handleNavigateToDetails = (id: number) => {
    setSelectedWineId(id);
    setCurrentScreen("details");
  };

  const handleSaveWine = () => {
    setCurrentScreen("library");
    setActiveTab("library");
    if (isEditMode) {
      toast.success("Vinho atualizado com sucesso!", { className: "text-white" });
      setIsEditMode(false);
      setSelectedWineId(null);
    } else {
      toast.success("Vinho adicionado à sua coleção!", { className: "text-white" });
    }
  };

  const handleEditWine = (id: number) => {
    setSelectedWineId(id);
    setIsEditMode(true);
    setCurrentScreen("create");
  };

  const handleDeleteWine = async (id: number) => {
    try {
      await api.deleteWine(id);
      setCurrentScreen("library");
      setActiveTab("library");
      toast.success("Vinho excluído da coleção");
      
      setSelectedWineId(null);
    } catch (e) {
      toast.error("Falha ao excluir vinho");
      console.error(e);
    }
  };

  const handleBottomNavigation = (tab: string) => {
    setActiveTab(tab);
    
    if (tab === "library") {
      setCurrentScreen("library");
    } else if (tab === "camera") {
      setCurrentScreen("create");
    } else if (tab === "profile") {
      setCurrentScreen("profile");
    } else if (tab === "scale") {
      setCurrentScreen("scale");
    }
  };

  const showBottomNav = ["library", "profile"].includes(currentScreen);

  return (
    <div className="max-w-2xl mx-auto bg-[#800000] min-h-screen">
      {currentScreen === "splash" && (
        <SplashScreen onComplete={() => setCurrentScreen("login")} />
      )}

      {currentScreen === "login" && (
        <LoginScreen
          onLogin={handleLogin}
          onNavigateToRegister={() => setCurrentScreen("register")}
        />
      )}

      {currentScreen === "register" && (
        <RegisterScreen
          onRegister={handleRegister}
          onNavigateToLogin={() => setCurrentScreen("login")}
        />
      )}

      {currentScreen === "library" && (
        <>
          <WineLibrary
            onNavigateToCreate={handleNavigateToCreate}
            onNavigateToDetails={handleNavigateToDetails}
          />
          <BottomNavigation
            activeTab={activeTab}
            onNavigate={handleBottomNavigation}
          />
        </>
      )}

      {currentScreen === "create" && (
        <CreateWineEntry
          wineId={isEditMode ? selectedWineId ?? undefined : undefined}
          isEditMode={isEditMode}
          onSave={handleSaveWine}
          onCancel={() => {
            setCurrentScreen("library");
            setActiveTab("library");
            setIsEditMode(false);
            setSelectedWineId(null);
          }}
        />
      )}

      {currentScreen === "details" && selectedWineId && (
        <WineDetails
          wineId={selectedWineId}
          onBack={() => {
            setCurrentScreen("library");
            setActiveTab("library");
          }}
          onEdit={handleEditWine}
          onDelete={handleDeleteWine}
        />
      )}

      {currentScreen === "profile" && (
        <> 
          <ProfileScreen 
            onLogout={handleLogout} 
            onOpenSettings={() => setCurrentScreen("settings")} 
            onOpenPreferences={() => setCurrentScreen("preferences")}
            refreshKey={profileRefreshKey}
          />
          <BottomNavigation
            activeTab={activeTab}
            onNavigate={handleBottomNavigation}
          />
        </>
      )}

      {currentScreen === "scale" && (
        <>
          <ScalePage />
          <BottomNavigation
            activeTab={activeTab}
            onNavigate={handleBottomNavigation}
          />
        </>
      )}

      {currentScreen === "settings" && (
        <>
          <AccountSettingsScreen onBack={() => setCurrentScreen("profile")} />
        </>
      )}

      {currentScreen === "database" && (
        <DatabaseScreen onBack={() => setCurrentScreen("profile")} />
      )}

      {currentScreen === "preferences" && (
        <>
          <TastePreferencesScreen onBack={() => {
            setCurrentScreen("profile");
            setProfileRefreshKey(prev => prev + 1);
          }} />
        </>
      )}

      <Toaster position="top-center" />
    </div>
  );
}
