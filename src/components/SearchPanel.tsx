import { useMemo, useState } from "react";
import { useStore } from "@/hooks/useStore";
import { formatCurrency } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { useLocation } from "wouter";
import { searchStore, SearchResult, SearchResultType } from "@/lib/search";
import { formatAppDate } from "@/utils/date";

const FILTERS: Array<{ label: string; value: SearchResultType }> = [
  { label: "Assets", value: "account" },
  { label: "Cards", value: "credit-card" },
  { label: "Loans", value: "loan" },
  { label: "Liabilities", value: "liability" },
  { label: "Transactions", value: "transaction" },
  { label: "People", value: "lend" },
];

const TYPE_LABEL: Record<SearchResultType, string> = {
  account: "Asset",
  "credit-card": "Card",
  loan: "Loan",
  liability: "Liability",
  transaction: "Transaction",
  lend: "Person",
};

function getAmountClass(result: SearchResult) {
  if (result.amount === undefined) {
    return "text-muted-foreground";
  }

  if (
    result.type === "liability" ||
    result.type === "loan" ||
    result.type === "credit-card"
  ) {
    return "text-destructive";
  }

  if (result.type === "transaction") {
    if (result.transactionType === "out") {
      return "text-destructive";
    }

    if (result.transactionType === "transfer") {
      return "text-primary";
    }

    return "text-[#34d399]";
  }

  return "text-primary";
}

function formatResultDate(date?: string) {
  if (!date) return null;
  return formatAppDate(date);
}

export function SearchPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { store } = useStore();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<SearchResultType[]>([]);

  if (!open) return null;

  const allResults = useMemo(() => searchStore(store, query), [store, query]);
  const results = useMemo(
    () =>
      selectedFilters.length === 0
        ? allResults
        : allResults.filter((result) => selectedFilters.includes(result.type)),
    [allResults, selectedFilters]
  );

  const toggleFilter = (value: SearchResultType) => {
    setSelectedFilters((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleResultClick = (result: SearchResult) => {
    setLocation(`${result.route}?focus=${encodeURIComponent(result.focusId)}`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Global search"
    >
      {/* Header */}
      <div className="bg-[#090A0F] border-b border-white/10 p-4">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-primary" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assets, loans, cards, liabilities, notes, amounts, people..."
            className="flex-1 bg-transparent text-foreground outline-none text-lg"
          />
          <button
            type="button"
            aria-label="Close search"
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {FILTERS.map((filter) => {
            const isSelected = selectedFilters.includes(filter.value);
            return (
              <button
                type="button"
                key={filter.value}
                aria-pressed={isSelected}
                onClick={() => toggleFilter(filter.value)}
                className={`px-2 py-1 rounded-full text-[11px] border transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-white/15 text-muted-foreground hover:bg-white/5"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {results.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            {query.trim() ? "No results found" : "Type to start searching"}
          </div>
        ) : (
          <div className="space-y-2">
            {results.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className="p-3 rounded-lg border border-white/5 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-left">{result.title}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded">
                        {TYPE_LABEL[result.type]}
                      </span>
                      <span className="text-[10px] bg-white/10 text-muted-foreground px-2 py-0.5 rounded">
                        {result.subtitle || "-"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    {result.amount !== undefined && (
                      <p className={`font-bold text-sm ${getAmountClass(result)}`}>
                        {formatCurrency(result.amount)}
                      </p>
                    )}
                    {result.date && (
                      <p className="text-[10px] text-muted-foreground">{formatResultDate(result.date)}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
