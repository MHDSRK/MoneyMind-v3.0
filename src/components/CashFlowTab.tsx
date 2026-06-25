import { useState } from "react";
import { useStore } from "@/hooks/useStore";
import {
  calculateCashFlow,
  calculateMonthlyTrend,
  calculateCategoryBreakdown,
  getDateRange,
} from "@/lib/cashFlow";
import { formatCurrency, cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, ArrowLeftRight } from "lucide-react";

type Period = "this-month" | "last-3-months" | "last-6-months" | "this-year" | "last-12-months";

const PERIODS: { value: Period; label: string }[] = [
  { value: "this-month", label: "This Month" },
  { value: "last-3-months", label: "3 Months" },
  { value: "last-6-months", label: "6 Months" },
  { value: "this-year", label: "This Year" },
  { value: "last-12-months", label: "12 Months" },
];

export function CashFlowTab() {
  const { store } = useStore();
  const [period, setPeriod] = useState<Period>("this-month");
  const [categoryType, setCategoryType] = useState<"in" | "out">("out");

  const { startDate, endDate, label } = getDateRange(period);
  const { income, expense, netCashFlow } = calculateCashFlow(
    store.transactions,
    startDate,
    endDate
  );

  const trendMonths =
    period === "this-month"
      ? 1
      : period === "last-3-months"
      ? 3
      : period === "last-6-months" || period === "this-year"
      ? 6
      : 12;
  const monthlyTrend = calculateMonthlyTrend(store.transactions, trendMonths);
  const categories = calculateCategoryBreakdown(
    store.transactions,
    startDate,
    endDate,
    categoryType
  );

  const maxBarValue = Math.max(
    ...monthlyTrend.map((m) => Math.max(m.income, m.expense)),
    1
  );

  return (
    <div className="pb-32 px-4 pt-24 space-y-6">
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold text-foreground">Cash Flow</h2>
        <span className="text-primary neon-text text-sm">{label}</span>
      </div>

      {/* Period Selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all",
              period === p.value
                ? "bg-primary text-primary-foreground"
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass-card p-3 flex flex-col items-center text-center">
          <TrendingUp className="w-4 h-4 text-[#34d399] mb-1" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Income
          </span>
          <span className="text-sm font-bold text-[#34d399]">
            {formatCurrency(income)}
          </span>
        </div>
        <div className="glass-card p-3 flex flex-col items-center text-center">
          <TrendingDown className="w-4 h-4 text-destructive mb-1" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Expenses
          </span>
          <span className="text-sm font-bold text-destructive">
            {formatCurrency(expense)}
          </span>
        </div>
        <div className="glass-card p-3 flex flex-col items-center text-center">
          <ArrowLeftRight className="w-4 h-4 text-primary mb-1" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Net
          </span>
          <span
            className={cn(
              "text-sm font-bold",
              netCashFlow >= 0 ? "text-primary neon-text" : "text-destructive"
            )}
          >
            {formatCurrency(netCashFlow)}
          </span>
        </div>
      </div>

      {/* Monthly Trend */}
      {monthlyTrend.length > 1 && (
        <div className="glass-card overflow-hidden">
          <div className="px-4 pt-4 pb-2 border-b border-white/5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Monthly Trend
            </p>
          </div>
          <div className="p-4">
            <div className="flex items-end gap-2 h-28">
              {monthlyTrend.map((m) => (
                <div key={m.monthKey} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-0.5 items-end" style={{ height: "80px" }}>
                    {/* Income bar */}
                    <div
                      className="flex-1 rounded-t bg-[#34d399]/60"
                      style={{
                        height: `${(m.income / maxBarValue) * 80}px`,
                        minHeight: m.income > 0 ? "2px" : 0,
                      }}
                    />
                    {/* Expense bar */}
                    <div
                      className="flex-1 rounded-t bg-destructive/60"
                      style={{
                        height: `${(m.expense / maxBarValue) * 80}px`,
                        minHeight: m.expense > 0 ? "2px" : 0,
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground leading-tight text-center whitespace-nowrap">
                    {m.month.split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-2 justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#34d399]/60" />
                <span className="text-[10px] text-muted-foreground">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-destructive/60" />
                <span className="text-[10px] text-muted-foreground">Expenses</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            By Category
          </p>
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            <button
              onClick={() => setCategoryType("out")}
              className={cn(
                "px-2.5 py-1 text-[10px] font-bold transition-all",
                categoryType === "out"
                  ? "bg-destructive/20 text-destructive"
                  : "text-muted-foreground hover:bg-white/5"
              )}
            >
              Expenses
            </button>
            <button
              onClick={() => setCategoryType("in")}
              className={cn(
                "px-2.5 py-1 text-[10px] font-bold transition-all",
                categoryType === "in"
                  ? "bg-[#34d399]/20 text-[#34d399]"
                  : "text-muted-foreground hover:bg-white/5"
              )}
            >
              Income
            </button>
          </div>
        </div>

        {categories.length === 0 ? (
          <div className="px-4 py-6 text-center text-muted-foreground italic text-sm">
            No {categoryType === "out" ? "expense" : "income"} transactions in this period
          </div>
        ) : (
          <div className="px-4 py-2 space-y-2.5">
            {categories.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground truncate flex-1 mr-2">
                    {cat.category}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground">
                      {cat.percentage.toFixed(0)}%
                    </span>
                    <span
                      className={cn(
                        "text-sm font-bold",
                        categoryType === "out" ? "text-destructive" : "text-[#34d399]"
                      )}
                    >
                      {formatCurrency(cat.amount)}
                    </span>
                  </div>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      categoryType === "out" ? "bg-destructive/70" : "bg-[#34d399]/70"
                    )}
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transfers excluded notice */}
      <p className="text-center text-[10px] text-muted-foreground italic pb-2">
        Transfers between accounts are excluded from cash flow
      </p>
    </div>
  );
}
