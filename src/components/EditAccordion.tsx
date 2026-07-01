import { ChevronDown, ChevronUp } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/utils";

interface EditAccordionProps {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function EditAccordion({ label, isOpen, onToggle, children }: EditAccordionProps) {
  const contentId = useId();

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-background/80">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-foreground hover:bg-white/5 transition-colors"
      >
        <span>{label}</span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <div
        id={contentId}
        className={cn(
          "overflow-hidden transition-[max-height,opacity] duration-200 ease-out",
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0",
        )}
        aria-hidden={!isOpen}
      >
        <div className="px-4 pb-4 pt-2">{children}</div>
      </div>
    </div>
  );
}
