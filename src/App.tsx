import { useState } from "react";
import { useLocation } from "wouter";
import { HomeTab } from "@/components/HomeTab";
import { TodayTab } from "@/components/TodayTab";
import { AssetsTab } from "@/components/AssetsTab";
import { LiabilitiesTab } from "@/components/LiabilitiesTab";
import { CreditCardsTab } from "@/components/CreditCardsTab";
import { LoansTab } from "@/components/LoansTab";
import ArchivedTab from "@/components/ArchivedTab";
import { ProfileMenu } from "@/components/ProfileMenu";
import NotFound from "@/pages/not-found";
import { Home, Calendar, WalletCards, CreditCard, Landmark, HandCoins } from "lucide-react";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";

const walletIconPath = "/logo.svg";
const profileIconPath = "/avatar.svg";

// Route to component mapping
const TAB_COMPONENTS: Record<string, React.ComponentType> = {
  "/": HomeTab,
  "/today": TodayTab,
  "/assets": AssetsTab,
  "/cards": CreditCardsTab,
  "/loans": LoansTab,
  "/others": LiabilitiesTab,
  "/archived": ArchivedTab,
};

function App() {
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const CurrentTab = TAB_COMPONENTS[location];

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
        {CurrentTab ? <CurrentTab /> : <NotFound />}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 h-20 z-40 bg-background/80 backdrop-blur-xl border-t border-white/10 pb-safe overflow-x-auto">
        <div className="flex items-center justify-center h-full px-4 gap-1">
          <NavButton icon={<Home className="w-5 h-5" />} label="Home"
            isActive={location === "/"} onClick={() => setLocation("/")} />
          <NavButton icon={<Calendar className="w-5 h-5" />} label="Today"
            isActive={location === "/today"} onClick={() => setLocation("/today")} />
          <NavButton icon={<WalletCards className="w-5 h-5" />} label="Assets"
            isActive={location === "/assets"} onClick={() => setLocation("/assets")} />
          <NavButton icon={<CreditCard className="w-5 h-5" />} label="Cards"
            isActive={location === "/cards"} onClick={() => setLocation("/cards")} />
          <NavButton icon={<Landmark className="w-5 h-5" />} label="Loans"
            isActive={location === "/loans"} onClick={() => setLocation("/loans")} />
          <NavButton icon={<HandCoins className="w-5 h-6" />} label="More"
            isActive={location === "/others"} onClick={() => setLocation("/others")} />
        </div>
      </nav>

      {/* Profile Menu */}
      <ProfileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Toaster />
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
    <button
      type="button"
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      onClick={onClick}
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
