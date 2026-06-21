import { useState } from "react";
import { HomeTab } from "@/components/HomeTab";
import { TodayTab } from "@/components/TodayTab";
import { AssetsTab } from "@/components/AssetsTab";
import { LiabilitiesTab } from "@/components/LiabilitiesTab";
import { ProfileMenu } from "@/components/ProfileMenu";
import { Home, Calendar, WalletCards, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

import walletIconPath from "@assets/apple-touch-icon_1782064032522.png";
import profileIconPath from "@assets/profile_1782064032522.png";

type Tab = "home" | "today" | "assets" | "liabilities";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [menuOpen, setMenuOpen] = useState(false);

  const renderTab = () => {
    switch (activeTab) {
      case "home": return <HomeTab />;
      case "today": return <TodayTab />;
      case "assets": return <AssetsTab />;
      case "liabilities": return <LiabilitiesTab />;
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex flex-col relative overflow-x-hidden selection:bg-primary/30">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 h-16 z-40 bg-background/60 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img src={walletIconPath} alt="Logo" className="w-8 h-8 rounded-lg shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
          <h1 className="text-lg font-bold text-primary tracking-wide neon-text">MoneyMind</h1>
        </div>
        <button
          onClick={() => setMenuOpen(true)}
          className="w-9 h-9 rounded-full border border-primary/50 overflow-hidden hover:border-primary transition-colors active:scale-95"
        >
          <img src={profileIconPath} alt="Profile" className="w-full h-full object-cover" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-md mx-auto">
        {renderTab()}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 h-20 z-40 bg-background/80 backdrop-blur-xl border-t border-white/10 pb-safe">
        <div className="flex items-center justify-around h-full px-6 max-w-md mx-auto">
          <NavButton icon={<Home className="w-6 h-6" />} label="Home"
            isActive={activeTab === "home"} onClick={() => setActiveTab("home")} />
          <NavButton icon={<Calendar className="w-6 h-6" />} label="Today"
            isActive={activeTab === "today"} onClick={() => setActiveTab("today")} />
          <div className="w-12" />
          <NavButton icon={<WalletCards className="w-6 h-6" />} label="Assets"
            isActive={activeTab === "assets"} onClick={() => setActiveTab("assets")} />
          <NavButton icon={<CreditCard className="w-6 h-6" />} label="Liabilities"
            isActive={activeTab === "liabilities"} onClick={() => setActiveTab("liabilities")} />
        </div>
      </nav>

      {/* Profile Menu */}
      <ProfileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}

function NavButton({ icon, label, isActive, onClick }: {
  icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={cn("flex flex-col items-center justify-center gap-1 w-16 relative transition-all duration-300",
        isActive ? "text-primary" : "text-muted-foreground hover:text-white/70")}>
      {icon}
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
      {isActive && (
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
      )}
    </button>
  );
}

export default App;
