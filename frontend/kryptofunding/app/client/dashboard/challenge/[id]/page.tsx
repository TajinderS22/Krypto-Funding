"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowLeft,
  Check,
  ChevronRight,
  CircleDollarSign,
  KeyRound,
  Landmark,
  Loader2,
  Target,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import api from "@/lib/axios";
import ApiKeyModal from "@/components/app/ApiKeyModal";
import AuthPromptModal from "@/components/app/AuthPromptModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MyChallenge } from "@/lib/types";

type ExchangeRecord = Record<string, unknown>;
type ChartPoint = { date: string; balance: number };

const numberValue = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const readList = (
  data: ExchangeRecord | null,
  key: string,
): ExchangeRecord[] => {
  const result = data?.[key] as ExchangeRecord | undefined;
  const nested = result?.result as ExchangeRecord | undefined;
  const list = nested?.list;
  return Array.isArray(list) ? (list as ExchangeRecord[]) : [];
};

const currency = (value: number | null | undefined) =>
  value === null || value === undefined || !Number.isFinite(value)
    ? "—"
    : new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);

const compactCurrency = (value: number | null | undefined) =>
  value === null || value === undefined || !Number.isFinite(value)
    ? "—"
    : new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof WalletCards;
  tone?: "default" | "positive" | "warning";
}) {
  const tones = {
    default:
      "bg-purple-500/10 text-purple-500 dark:bg-[#a855f7]/10 dark:text-[#a855f7]",
    positive:
      "bg-amber-400/10 text-amber-400 dark:bg-[#fbbf24]/10 dark:text-[#fbbf24]",
    warning: "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  };

  return (
    <Card className="gap-0 rounded-md border-gray-300 py-0 shadow-none dark:border-[#3b353c]">
      <CardContent className="p-5">
        <div className="mb-5 flex items-start justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-[#82717b]">
            {label}
          </p>
          <span className={`rounded-md p-2 ${tones[tone]}`}>
            <Icon className="size-4" />
          </span>
        </div>
        <p className="text-2xl font-black tracking-tighter sm:text-3xl">
          {value}
        </p>
        <p className="mt-1.5 text-xs text-gray-500 dark:text-[#82717b]">
          {detail}
        </p>
      </CardContent>
    </Card>
  );
}

export default function ClientChallengePage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const purchaseId = searchParams.get("purchase");
  const router = useRouter();
  const [myChallenge, setMyChallenge] = useState<MyChallenge | null>(null);
  const [exchangeData, setExchangeData] = useState<ExchangeRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);


  console.log(myChallenge, purchaseId)

  const fetchExchangeData = async (
    challenge: MyChallenge,
    refreshing = false,
  ) => {
    if (!challenge.status?.hasApiKey) return;
    if (refreshing) setIsRefreshing(true);
    try {
      const response = await api.post("/core/status-update", {
        challengeId: challenge.challenge.id,
        purchaseId: challenge.purchase_id,
      });
      setExchangeData(response.data as ExchangeRecord);
    } catch (requestError) {
      console.error("Could not refresh exchange data", requestError);
    } finally {
      if (refreshing) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const response = await api.get("/user/challenges/my-challenges");
        const all: MyChallenge[] = [
          ...(response.data.active || []),
          ...(response.data.failed || []),
          ...(response.data.passed || []),
        ];
        const found = all.find(
          (item) =>
            item.challenge.id === id &&
            String(item.purchase_id) === purchaseId &&
            item.status?.status === "active",
        );
        if (!found) {
          setError("This challenge is no longer active.");
          return;
        }
        setMyChallenge(found);
        if (found.status?.hasApiKey) {
          await fetchExchangeData(found);
        } else {
          setShowApiKeyModal(true);
        }
      } catch (requestError: unknown) {
        const axiosError = requestError as { response?: { status?: number } };
        if (axiosError.response?.status === 401) setShowAuthModal(true);
        else setError("We couldn’t load this challenge right now.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchChallenge();
  }, [id, purchaseId]);

  const handleApiKeyComplete = async () => {
    setShowApiKeyModal(false);
    try {
      const response = await api.get("/user/challenges/my-challenges");
      const all: MyChallenge[] = [
        ...(response.data.active || []),
        ...(response.data.failed || []),
        ...(response.data.passed || []),
      ];
      const found = all.find(
        (item) =>
          item.challenge.id === id &&
          String(item.purchase_id) === purchaseId &&
          item.status?.status === "active",
      );
      if (found) {
        setMyChallenge(found);
        await fetchExchangeData(found);
      }
    } catch (requestError) {
      console.error(
        "Could not reload challenge after connecting exchange",
        requestError,
      );
    }
  };

  console.log(exchangeData);
  const account = useMemo(() => {
    const wallet = readList(exchangeData, "walletBalance");
    const coins = (wallet[0]?.coin as ExchangeRecord[] | undefined) || [];
    const usdt = coins.find((coin) => coin.coin === "USDT") || coins[0];
    const equity =
      numberValue(usdt?.equity) ?? numberValue(usdt?.walletBalance);
    const available =
      numberValue(usdt?.availableToWithdraw) ??
      numberValue(usdt?.availableBalance);
    const closed = readList(exchangeData, "closedPositions");
    const executions = readList(exchangeData, "tradeHistory");
    const activeOrders = readList(exchangeData, "activeOrders");
    const history = closed.length ? closed : executions;
    const realizedPnl = history.reduce(
      (sum, item) =>
        sum + (numberValue(item.closedPnl) ?? numberValue(item.execPnl) ?? 0),
      0,
    );
    const chart = history
      .map((item, index) => {
        const timestamp =
          numberValue(item.updatedTime) ??
          numberValue(item.execTime) ??
          numberValue(item.createdTime);
        const pnl =
          numberValue(item.closedPnl) ?? numberValue(item.execPnl) ?? 0;
        return { timestamp: timestamp ?? index, pnl };
      })
      .sort((a, b) => a.timestamp - b.timestamp)
      .reduce<ChartPoint[]>((points, item, index, items) => {
        const startingBalance =
          (equity ?? 0) - items.reduce((sum, trade) => sum + trade.pnl, 0);
        const balance =
          startingBalance +
          items.slice(0, index + 1).reduce((sum, trade) => sum + trade.pnl, 0);
        const date =
          typeof item.timestamp === "number" && item.timestamp > 1_000_000
            ? new Date(item.timestamp).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
            : `Trade ${index + 1}`;
        return [...points, { date, balance }];
      }, []);
    return {
      equity,
      available,
      realizedPnl,
      activeOrders: activeOrders.length,
      chart,
    };
  }, [exchangeData]);

  if (isLoading) {
    return (
      <div className="grid min-h-[95vh] place-items-center">
        <Loader2 className="size-12 animate-spin text-amber-400 dark:text-[#fbbf24]" />
      </div>
    );
  }
  if (error || !myChallenge) {
    return (
      <div className="grid min-h-[70vh] place-items-center px-6 text-center">
        <div>
          <p className="text-lg font-bold uppercase tracking-widest">
            {error || "Challenge not found"}
          </p>
          <Button
            asChild
            variant="link"
            className="mt-2 text-purple-500 dark:text-[#a855f7]"
          >
            <Link href="/client/dashboard">
              <ArrowLeft />
              Back to dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const challenge = myChallenge.challenge;
  const currentStep = myChallenge.status?.currentStepStatus ?? 1;
  const totalSteps = myChallenge.status?.steps ?? challenge.steps ?? 1;
  const startingBalance = challenge.value ?? 0;
  const targetBalance = startingBalance * (1 + (challenge.target ?? 0) / 100);
  const targetProgress =
    account.equity === null
      ? 0
      : Math.min(
        100,
        Math.max(
          0,
          ((account.equity - startingBalance) /
            Math.max(1, targetBalance - startingBalance)) *
          100,
        ),
      );
  const hasLiveData = account.equity !== null;

  return (
    <main className="min-h-screen bg-gray-50 pb-12 dark:bg-[#050304]">
      <div className="border-b border-gray-300 bg-white dark:border-[#3b353c] dark:bg-[#090909]">
        <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 mb-5 text-gray-500 hover:text-gray-900 dark:text-[#82717b] dark:hover:text-[#c1cfc1]"
          >
            <Link href="/client/dashboard">
              <ArrowLeft />
              All challenges
            </Link>
          </Button>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Badge className="bg-amber-400 text-white hover:bg-amber-400 dark:bg-[#fbbf24] dark:text-[#090909]">
                  <span className="size-1.5 rounded-md bg-white dark:bg-[#090909]" />
                  Active
                </Badge>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-[#82717b]">
                  Step {currentStep} of {totalSteps}
                </span>
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tighter sm:text-4xl">
                {challenge.title}
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-[#82717b]">
                Your evaluation at a glance, updated directly from your exchange
                account.
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-md border-gray-300 uppercase tracking-widest font-bold hover:bg-gray-100 dark:border-[#3b353c] dark:hover:bg-[#0c0c0c]"
              onClick={() => fetchExchangeData(myChallenge, true)}
              disabled={!myChallenge.status?.hasApiKey || isRefreshing}
            >
              <Activity className={isRefreshing ? "animate-spin" : ""} />
              Refresh data
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-5 py-7 sm:px-8">
        {!myChallenge.status?.hasApiKey && (
          <Card className="rounded-md border-amber-400/30 bg-amber-400/5 py-0 dark:border-[#fbbf24]/30">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <KeyRound className="mt-0.5 size-5 text-amber-400 dark:text-[#fbbf24]" />
                <div>
                  <p className="font-bold uppercase tracking-widest text-sm">
                    Connect your exchange to see live performance
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-[#82717b]">
                    Balance, P&amp;L and trade history will appear here after
                    connecting.
                  </p>
                </div>
              </div>
              <Button
                className="rounded-md bg-purple-500 text-sm font-black uppercase tracking-widest text-white hover:bg-purple-600 dark:bg-[#a855f7] dark:hover:bg-[#c084fc]"
                onClick={() => setShowApiKeyModal(true)}
              >
                Connect exchange
                <ChevronRight />
              </Button>
            </CardContent>
          </Card>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Current balance"
            value={
              hasLiveData
                ? currency(account.equity)
                : compactCurrency(startingBalance)
            }
            detail={hasLiveData ? "Live exchange equity" : "Starting balance"}
            icon={WalletCards}
            tone="default"
          />
          <MetricCard
            label="Realized P&L"
            value={
              hasLiveData ? currency(account.realizedPnl) : "Connect exchange"
            }
            detail={hasLiveData ? "From closed trades" : "No live data yet"}
            icon={account.realizedPnl >= 0 ? TrendingUp : TrendingDown}
            tone={account.realizedPnl >= 0 ? "positive" : "warning"}
          />
          <MetricCard
            label="Profit target"
            value={`${challenge.target ?? 0}%`}
            detail={`${targetProgress.toFixed(0)}% of target reached`}
            icon={Target}
            tone="positive"
          />
          <MetricCard
            label="Open orders"
            value={hasLiveData ? String(account.activeOrders) : "—"}
            detail={
              hasLiveData
                ? "Currently at the exchange"
                : "Connect exchange to view"
            }
            icon={Landmark}
            tone="default"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="rounded-md border-gray-300 py-0 shadow-sm dark:border-[#3b353c]">
            <CardHeader className="flex-row items-start justify-between border-b border-gray-300 py-5 dark:border-[#3b353c]">
              <div>
                <CardTitle className="font-bold uppercase tracking-widest">
                  Balance history
                </CardTitle>
                <p className="mt-1 text-sm text-gray-500 dark:text-[#82717b]">
                  Equity based on your latest closed trades.
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">
                  {hasLiveData ? currency(account.equity) : "Waiting for data"}
                </p>
                <p className="text-xs text-gray-500 dark:text-[#82717b]">
                  Current balance
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {account.chart.length > 1 ? (
                <div className="h-[330px] p-4 pt-6 sm:p-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={account.chart}
                      margin={{ top: 8, right: 8, left: 4, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="balance-fill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#a855f7"
                            stopOpacity={0.22}
                          />
                          <stop
                            offset="95%"
                            stopColor="#a855f7"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        className="stroke-gray-300 dark:stroke-[#3b353c]"
                      />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tickMargin={10}
                        className="fill-gray-500 text-xs dark:fill-[#82717b]"
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tickMargin={10}
                        width={70}
                        tickFormatter={(value) => compactCurrency(value)}
                        className="fill-gray-500 text-xs dark:fill-[#82717b]"
                      />
                      <Tooltip
                        formatter={(value) => currency(numberValue(value))}
                        contentStyle={{
                          borderRadius: 10,
                          borderColor: "var(--border)",
                          background: "var(--card)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="#a855f7"
                        strokeWidth={2.5}
                        fill="url(#balance-fill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="grid h-[330px] place-items-center p-6 text-center">
                  <div>
                    <CircleDollarSign className="mx-auto mb-3 size-8 text-purple-500/60 dark:text-[#a855f7]/60" />
                    <p className="font-bold uppercase tracking-widest text-sm">
                      Your balance history will build here
                    </p>
                    <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-[#82717b]">
                      Close a trade on your connected exchange to start seeing
                      performance over time.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-md border-gray-300 py-0 shadow-sm dark:border-[#3b353c]">
            <CardHeader className="border-b border-gray-300 py-5 dark:border-[#3b353c]">
              <CardTitle className="font-bold uppercase tracking-widest">
                Challenge progress
              </CardTitle>
              <p className="text-sm text-gray-500 dark:text-[#82717b]">
                Your current evaluation step.
              </p>
            </CardHeader>
            <CardContent className="space-y-6 p-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-[#82717b]">
                    Profit target
                  </span>
                  <span className="font-bold">
                    {targetProgress.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-md bg-gray-200 dark:bg-[#3b353c]">
                  <div
                    className="h-full rounded-md bg-gradient-to-r from-purple-500 to-amber-400 transition-all dark:from-[#a855f7] dark:to-[#fbbf24]"
                    style={{ width: `${targetProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-[#82717b]">
                  Target balance: {currency(targetBalance)}
                </p>
              </div>
              <div className="space-y-3 border-t border-gray-300 pt-5 dark:border-[#3b353c]">
                {Array.from({ length: totalSteps }, (_, index) => {
                  const step = index + 1;
                  const completed = step < currentStep;
                  const active = step === currentStep;
                  return (
                    <div key={step} className="flex items-center gap-3">
                      <span
                        className={`grid size-7 place-items-center rounded-full text-xs font-bold ${completed ? "bg-amber-400 text-white dark:bg-[#fbbf24] dark:text-[#090909]" : active ? "bg-purple-500 text-white dark:bg-[#a855f7]" : "bg-gray-200 text-gray-500 dark:bg-[#3b353c] dark:text-[#82717b]"}`}
                      >
                        {completed ? <Check className="size-4" /> : step}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-bold uppercase tracking-widest">
                          Stage {step}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-[#82717b]">
                          {completed
                            ? "Completed"
                            : active
                              ? "In progress"
                              : "Locked"}
                        </p>
                      </div>
                      {active && (
                        <Badge className="bg-purple-500 text-white hover:bg-purple-500 dark:bg-[#a855f7]">
                          Current
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-gray-300 pt-5 text-sm dark:border-[#3b353c]">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-[#82717b]">
                    Max drawdown
                  </span>
                  <span className="font-bold">
                    {challenge.drawdown ?? "—"}%
                  </span>
                </div>
                <div className="mt-3 flex justify-between">
                  <span className="text-gray-500 dark:text-[#82717b]">
                    Available balance
                  </span>
                  <span className="font-bold">
                    {currency(account.available)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <ApiKeyModal
        challengeId={challenge.id}
        challengeTitle={challenge.title}
        purchaseId={myChallenge.purchase_id}
        isOpen={showApiKeyModal}
        onClose={() => router.push("/client/dashboard")}
        onComplete={handleApiKeyComplete}
      />
      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => router.push("/auth/signin")}
      />
    </main>
  );
}
