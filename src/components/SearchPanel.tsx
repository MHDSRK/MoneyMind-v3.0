import { useState } from "react";
import { useStore } from "@/hooks/useStore";
import { formatCurrency } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { format, parseISO } from "date-fns";

export function SearchPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { store } = useStore();
  const [query, setQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  if (!open) return null;

  const results = store.transactions.filter((t) => {
    if (t.deleted) return false;

    const matchesQuery =
      query === "" ||
      t.amount.toString().includes(query) ||
      t.ledger.toLowerCase().includes(query.toLowerCase()) ||
      t.category.toLowerCase().includes(query.toLowerCase()) ||
      t.notes.toLowerCase().includes(query.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())) ||
      t.date.includes(query);

    return matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
      {/* Header */}
      <div className="bg-[#090A0F] border-b border-white/10 p-4">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-primary" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transactions..."
            className="flex-1 bg-transparent text-foreground outline-none text-lg"
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {results.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No results found
          </div>
        ) : (
          <div className="space-y-2">
            {results.map((tx) => (
              <div
                key={tx.id}
                className="p-3 rounded-lg border border-white/5 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{tx.ledger}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded">
                        {tx.category}
                      </span>
                      {tx.tags.map((tag) => (
                        <span key={tag} className="text-[10px] bg-white/10 text-muted-foreground px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className={`font-bold text-sm ${tx.type === "in" ? "text-[#34d399]" : "text-destructive"}`}>
                      {tx.type === "in" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(parseISO(tx.date), "d MMM")}
                    </p>
                  </div>
                </div>
                {tx.notes && (
                  <p className="text-[11px] text-muted-foreground mt-2">{tx.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
