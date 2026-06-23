import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { HomeTab } from "@/components/HomeTab";
import { TodayTab } from "@/components/TodayTab";
import { AssetsTab } from "@/components/AssetsTab";
import { LiabilitiesTab } from "@/components/LiabilitiesTab";
import { CreditCardsTab } from "@/components/CreditCardsTab";
import { LoansTab } from "@/components/LoansTab";
import { ProfileMenu } from "@/components/ProfileMenu";
import { Home, Calendar, WalletCards, CreditCard, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

const walletIconPath = "/favicon.svg";
const profileIconPath = "/favicon.svg";

function App() {
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Route matching
  const [matchHome] = useRoute("/");
  const [matchToday] = useRoute("/today");
  const [matchAssets] = useRoute("/assets");
  const [matchCards] = useRoute("/cards");
  const [matchLoans] = useRoute("/loans");
  const [matchOthers] = useRoute("/others");

  const renderTab = () => {
    if (matchToday) return <TodayTab />;
    if (matchAssets) return <AssetsTab />;
    if (matchCards) return <CreditCardsTab />;
    if (matchLoans) return <LoansTab />;
    if (matchOthers) return <LiabilitiesTab />;
    return <HomeTab />; // Default route
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
      <nav className="fixed bottom-0 inset-x-0 h-20 z-40 bg-background/80 backdrop-blur-xl border-t border-white/10 pb-safe overflow-x-auto">
        <div className="flex items-center justify-start h-full px-4 max-w-md mx-auto gap-1 min-w-max">
          <NavButton icon={<Home className="w-5 h-5" />} label="Home"
            isActive={matchHome} onClick={() => setLocation("/")} />
          <NavButton icon={<Calendar className="w-5 h-5" />} label="Today"
            isActive={matchToday} onClick={() => setLocation("/today")} />
          <NavButton icon={<WalletCards className="w-5 h-5" />} label="Assets"
            isActive={matchAssets} onClick={() => setLocation("/assets")} />
          <NavButton icon={<CreditCard className="w-5 h-5" />} label="Cards"
            isActive={matchCards} onClick={() => setLocation("/cards")} />
          <NavButton icon={<Landmark className="w-5 h-5" />} label="Loans"
            isActive={matchLoans} onClick={() => setLocation("/loans")} />
          <NavButton icon={<CreditCard className="w-5 h-6" />} label="Others"
            isActive={matchOthers} onClick={() => setLocation("/others")} />
        </div>
      </nav>

      {/* Profile Menu */}
      <ProfileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}

function NavButton({ icon, label, isActive, onClick }: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={cn("flex flex-col items-center justify-center gap-1 px-3 py-2 relative transition-all duration-300 shrink-0 whitespace-nowrap",
        isActive ? "text-primary" : "text-muted-foreground hover:text-white/70")}>
      {icon}
      <span className="text-[9px] font-medium tracking-wide leading-tight">{label}</span>
      {isActive && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
      )}
    </button>
  );
}

export default App;
