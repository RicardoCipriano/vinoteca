import { Wine, Camera, User, BarChart3 } from "lucide-react";

interface BottomNavigationProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

export function BottomNavigation({ activeTab, onNavigate }: BottomNavigationProps) {
  const tabs = [
    { id: "library", label: "Collection", icon: Wine },
    { id: "scale", label: "Escala", icon: BarChart3 },
    { id: "camera", label: "Add", icon: Camera },
    { id: "profile", label: "Profile", icon: User }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#CDA15D]/20 shadow-lg z-40">
      <div className="grid grid-cols-4 h-16 max-w-2xl mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? "text-[#6B0F12]" : "text-[#6B6B6B]"
              }`}
            >
              <Icon 
                className={`w-6 h-6 ${isActive ? "fill-[#6B0F12]" : ""}`} 
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span className="text-xs">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
