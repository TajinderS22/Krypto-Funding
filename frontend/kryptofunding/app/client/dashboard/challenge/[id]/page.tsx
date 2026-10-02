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
    DollarSign,
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
import {
    FailReasonCard,
    PassCertificate,
} from "@/components/app/PastChallengeDetail";
import { isPartiallyPassed, phaseOf } from "@/lib/challengePhase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MyChallenge } from "@/lib/types";

type ExchangeRecord = Record<string, unknown>;
type ChartPoint = { date: number; balance: number };

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
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    // const [winRate,setWinRate] = useState(0);



    const fetchExchangeData = async (
        challenge: MyChallenge,
        refreshing = false,
    ) => {
        // Live phase only: keys submitted for the current step and no
        // terminal state. Null-safe — legacy rows carry NULL, not false.
        if (phaseOf(challenge) !== "live") return;
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
                        (item.status?.status === "active" ||
                            item.status?.status === "partially_passed" ||
                            item.status?.status === "passed" ||
                            item.status?.status === "failed"),
                );
                if (!found) {
                    setError("Challenge not found for this purchase.");
                    return;
                }
                setMyChallenge(found);
                if (found.status?.hasApiKey === true) {
                    await fetchExchangeData(found);
                } else if ((found.status?.currentStep ?? 1) === 1) {
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




    const showLivePolling = phaseOf(myChallenge) === "live";

    useEffect(() => {
        if (!showLivePolling || !myChallenge) return;

        const initialFetch = setTimeout(() => {
            void fetchExchangeData(myChallenge);
        }, 0);

        const interval = setInterval(() => {
            void fetchExchangeData(myChallenge);
        }, 10000);

        return () => {
            clearTimeout(initialFetch);
            clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [myChallenge?.purchase_id, showLivePolling, refreshTrigger]);

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
                    (item.status?.status === "active" ||
                        item.status?.status === "partially_passed" ||
                        item.status?.status === "passed"),
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

    const account = useMemo(() => {
        const wallet = readList(exchangeData, "walletBalance");
        const coins = (wallet[0]?.coin as ExchangeRecord[] | undefined) || [];
        const usdt = coins.find((coin) => coin.coin === "USDT") || coins[0];
        const equity = numberValue(usdt?.equity) ?? numberValue(usdt?.walletBalance);
        const available = numberValue(usdt?.availableToWithdraw) ?? numberValue(usdt?.availableBalance);
        const closed = readList(exchangeData, "closedPositions");
        const executions = readList(exchangeData, "tradeHistory");
        const activeOrders = readList(exchangeData, "activeOrders");
        const history = closed.length ? closed : executions;

        const wins = closed.reduce(
            (count, item) => count + (Number(item.closedPnl) > 0 ? 1 : 0),
            0,
        );
        const winRate = closed.length > 0 ? (wins / closed.length) * 100 : 0;

        const realizedPnl = history.reduce(
            (sum, item) =>
                sum + (numberValue(item.closedPnl) ?? numberValue(item.execPnl) ?? 0),
            0,
        );

        const unrealizedPnl =
            numberValue((coins[0] as ExchangeRecord | undefined)?.unrealisedPnl) ??
            0;
        const targetValue = myChallenge?.status?.value;
        const isProfit = typeof targetValue === "number" ? equity! >= targetValue : false;


        const grossLoss = closed.reduce((sum, item) => {
            const pnl = numberValue(item.closedPnl) ?? 0;
            return sum + (pnl < 0 ? Math.abs(pnl) : 0);
        }, 0);

        const grossProfit = closed.reduce((sum, item) => {
            const pnl = numberValue(item.closedPnl) ?? 0;
            return sum + (pnl > 0 ? pnl : 0)
        }, 0)


        const profitFactor = grossLoss == 0 ? "∞" : (grossProfit / grossLoss).toFixed(2);

        const color = isProfit ? "#22c55e" : "#ef4444";
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
                const startingBalance = (equity ?? 0) - items.reduce((sum, trade) => sum + trade.pnl, 0);
                const balance = startingBalance + items.slice(0, index + 1).reduce((sum, trade) => sum + trade.pnl, 0);
                const date = item.timestamp;
                return [...points, { date, balance }];
            }, []);
        return {
            equity,
            available,
            realizedPnl,
            winRate,
            activeOrders: activeOrders.length,
            chart,
            color,
            targetValue,
            closed,
            unrealizedPnl,
            profitFactor
        };
    }, [exchangeData]);

    const isInProfit =
        account.equity !== null &&
        account.targetValue !== undefined &&
        account.equity >= (account.targetValue ?? 0);

    const challenge = myChallenge?.challenge;
    const currentStep = myChallenge?.status?.currentStep ?? 1;
    const totalSteps =
        myChallenge?.status?.steps ?? challenge?.steps ?? 1;

    // Single source of truth: one phase drives banners, metrics, timeline,
    // modal, polling and certificate. Certificate requires full completion
    // (status + flag + passedAt + pointer + final-step keys); anything else
    // mid-challenge renders the celebration + Continue flow instead.
    const phase = phaseOf(myChallenge);
    const isFailed = phase === "failed";
    const isAllPassed = phase === "fully-passed";
    const isReadOnlyPast = isFailed || isAllPassed;
    const hasPassedPreviousStep = phase === "stage-passed-awaiting-keys";
    const showLive = phase === "live";
    // partially_passed + keys submitted = current stage running (never the
    // certificate — that stays gated on isAllPassed / "fully-passed").
    const isPartiallyRunning = isPartiallyPassed(myChallenge) && showLive;

    const startingBalance = challenge?.value ?? 0;
    const targetPercentage = challenge?.target ?? 0;
    const targetProfitAmount = (startingBalance * targetPercentage) / 100;
    const targetBalance = startingBalance + targetProfitAmount;
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
    const hasLiveData = showLive && account.equity !== null;

    const challengeValueForTarget =
        myChallenge?.status?.value ?? challenge?.value ?? 0;
    const challengeTargetPct = challenge?.target ?? 0;
    const target = (challengeValueForTarget * challengeTargetPct) / 100;
    const currentAchived =
        account.equity !== null &&
        account.targetValue !== null &&
        account.targetValue !== undefined
            ? account.equity - (account.targetValue as number)
            : 0;
    const targetAchived = target - (target - currentAchived);
    const targetAchivedPercent =
        target > 0 ? (targetAchived / target) * 100 : 0;

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
                                {isAllPassed ? (
                                    <Badge className="bg-green-500 text-white hover:bg-green-500">
                                        Passed
                                    </Badge>
                                ) : isFailed ? (
                                    <Badge variant="destructive">Failed</Badge>
                                ) : hasPassedPreviousStep ? (
                                    <Badge className="bg-amber-400 text-white hover:bg-amber-400 dark:bg-[#fbbf24] dark:text-[#090909]">
                                        <span className="size-1.5 animate-pulse rounded-md bg-white dark:bg-[#090909]" />
                                        In progress · Stage {currentStep - 1} of {totalSteps} done
                                    </Badge>
                                ) : isPartiallyRunning ? (
                                    <Badge className="bg-purple-500 text-white hover:bg-purple-500 dark:bg-[#a855f7]">
                                        <span className="size-1.5 animate-pulse rounded-md bg-white dark:bg-[#090909]" />
                                        Partially passed · Stage {currentStep} of {totalSteps}
                                    </Badge>
                                ) : (
                                    <Badge className="bg-amber-400 text-white hover:bg-amber-400 dark:bg-[#fbbf24] dark:text-[#090909]">
                                        <span className="size-1.5 rounded-md bg-white dark:bg-[#090909]" />
                                        Active
                                    </Badge>
                                )}
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-[#82717b]">
                                    Step {currentStep} of {totalSteps}
                                </span>
                            </div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter sm:text-4xl">
                                {challenge?.title}
                            </h1>
                            <p className="mt-2 text-sm text-gray-500 dark:text-[#82717b]">
                                Your evaluation at a glance, updated directly from your exchange
                                account.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="rounded-md border-gray-300 uppercase tracking-widest font-bold hover:bg-gray-100 dark:border-[#3b353c] dark:hover:bg-[#0c0c0c]"
                            onClick={() => {
                                if (!myChallenge) return;
                                fetchExchangeData(myChallenge, true)
                                setRefreshTrigger(t => t + 1)
                            }}
                            disabled={!showLive || isRefreshing}
                        >
                            <Activity className={isRefreshing ? "animate-pulse" : ""} />
                            Refresh data
                        </Button>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl space-y-6 px-5 py-7 sm:px-8">
                {isFailed && myChallenge && <FailReasonCard item={myChallenge} />}
                {isAllPassed && myChallenge && <PassCertificate item={myChallenge} />}
                {phase === "no-keys-step1" && (
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


                {hasPassedPreviousStep && (
                    <Card className="rounded-md border-purple-500/30 bg-purple-500/10 p-5 dark:border-[#a855f7]/30 dark:bg-[#a855f7]/10">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="grid size-10 place-items-center rounded-full bg-purple-500 text-white dark:bg-[#a855f7]">
                                    <Check className="size-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black uppercase tracking-tight text-purple-950 dark:text-white">
                                        Stage {currentStep - 1} Passed! Ready for Stage {currentStep}
                                    </h3>
                                    <p className="text-xs text-gray-600 dark:text-[#82717b]">
                                        Congratulations! You reached the profit target for Stage {currentStep - 1}. Review your results below. Click below when ready to connect your Stage {currentStep} exchange credentials.
                                    </p>
                                </div>
                            </div>
                            <Button
                                className="rounded-md bg-purple-500 font-bold uppercase tracking-wider text-white hover:bg-purple-600 dark:bg-[#a855f7] dark:hover:bg-[#c084fc]"
                                onClick={() => setShowApiKeyModal(true)}
                            >
                                <KeyRound className="mr-2 size-4" />
                                Start Stage {currentStep}
                            </Button>
                        </div>
                    </Card>
                )}



                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        label="Current balance"
                        value={
                            hasPassedPreviousStep
                                ? currency(targetBalance)
                                : isReadOnlyPast
                                  ? currency(
                                        Number(
                                            myChallenge.status?.currentBalance,
                                        ) || startingBalance,
                                    )
                                  : hasLiveData
                                    ? currency(account.equity)
                                    : compactCurrency(startingBalance)
                        }
                        detail={
                            hasPassedPreviousStep
                                ? `Stage ${currentStep - 1} target achieved`
                                : isReadOnlyPast
                                  ? "Final balance"
                                  : hasLiveData
                                    ? "Live exchange equity"
                                    : "Starting balance"
                        }
                        icon={WalletCards}
                        tone="default"
                    />
                    <MetricCard
                        label="Realized P&L"
                        value={
                            hasPassedPreviousStep
                                ? currency(targetProfitAmount)
                                : hasLiveData
                                  ? currency(account.realizedPnl)
                                  : "Connect exchange"
                        }
                        detail={
                            hasPassedPreviousStep
                                ? `Stage ${currentStep - 1} target profit`
                                : hasLiveData
                                  ? "From closed trades"
                                  : "No live data yet"
                        }
                        icon={
                            hasPassedPreviousStep
                                ? TrendingUp
                                : account.unrealizedPnl >= 0
                                  ? TrendingUp
                                  : TrendingDown
                        }
                        tone={
                            hasPassedPreviousStep
                                ? "positive"
                                : account.unrealizedPnl >= 0
                                  ? "positive"
                                  : "warning"
                        }
                    />
                    <MetricCard
                        label="Win rate"
                        value={`${account.winRate.toFixed(2)}%`}
                        detail={`based on last ${account.closed.length} closed positions`}
                        icon={Target}
                        tone="positive"
                    />
                    <MetricCard
                        label="Profit Factor"
                        value={hasLiveData ? String(account.profitFactor) : "—"}
                        detail={
                            hasLiveData
                                ? `based on last ${account.closed.length} closed positions`
                                : "Connect exchange to view"
                        }
                        icon={Landmark}
                        tone="default"
                    />
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <Card className="rounded-md border-gray-300 py-0 shadow-sm dark:border-[#3b353c]">
                        <CardHeader className={`flex items-center justify-between border-b border-gray-300 py-5 dark:border-[#3b353c]`}>
                            <div className="">
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
                                        <AreaChart data={account.chart}>
                                            <defs>
                                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={account.color} stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor={account.color} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>

                                            <CartesianGrid strokeDasharray="3 3" />

                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={(date) =>
                                                    new Date(date).toLocaleDateString("en-IN", {
                                                        day: "numeric",
                                                        month: "short",
                                                    })
                                                }
                                            />

                                            <YAxis />

                                            <Tooltip

                                                contentStyle={{
                                                    background: "rgba(24, 24, 27, 0.85)",
                                                    backdropFilter: "blur(12px)",
                                                    border: "1px solid rgba(255,255,255,0.08)",
                                                    borderRadius: "12px",
                                                    boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
                                                    padding: "10px 14px",
                                                }}
                                                labelStyle={{
                                                    color: "#a1a1aa",
                                                    fontSize: 12,
                                                    fontWeight: 500,
                                                    marginBottom: 6,
                                                }}
                                                itemStyle={{
                                                    color: `${account.color}`,
                                                    fontSize: 14,
                                                    fontWeight: 600,
                                                }}
                                                cursor={{
                                                    stroke: "#71717a",
                                                    strokeDasharray: "4 4",
                                                }}
                                                labelFormatter={(date) =>
                                                    new Date(date).toLocaleDateString("en-IN", {
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric",
                                                    })
                                                }

                                                formatter={(balance) =>
                                                    `$${balance?.toLocaleString()}`
                                                }
                                            />


                                            <Area
                                                type="monotone"
                                                dataKey="balance"
                                                stroke={account.color}
                                                strokeWidth={2}
                                                fill="url(#colorValue)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>


                                </div>
                            ) : (
                                <div className="grid h-[330px] place-items-center p-6 text-center">
                                    <div>
                                        <CircleDollarSign className="mx-auto mb-3 size-8 text-purple-500/60 dark:text-[#a855f7]/60" />
                                        <p className="font-bold uppercase tracking-widest text-sm">
                                            {isReadOnlyPast
                                                ? "History frozen at final balance"
                                                : hasPassedPreviousStep
                                                  ? "Stage 1 complete — connect Stage 2 to build new history"
                                                  : "Your balance history will build here"}
                                        </p>
                                        <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-[#82717b]">
                                            {isReadOnlyPast
                                                ? "This evaluation is closed. Details above are static placeholders until history fetch ships."
                                                : hasPassedPreviousStep
                                                  ? "Your Stage 1 target is locked in. Start the next stage to resume live charting."
                                                  : "Close a trade on your connected exchange to start seeing performance over time."}
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
                            {hasPassedPreviousStep ? (
                                <div>
                                    <div className="mb-2 flex items-center justify-between text-sm">
                                        <span className="text-gray-500 flex gap-1 dark:text-[#82717b]">
                                            <p>Profit Target :</p>
                                            <p className="flex items-center">
                                                <DollarSign size={14} /> {target}
                                            </p>
                                        </span>
                                        <span className="font-bold">100%</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-md bg-gray-200 dark:bg-[#3b353c]">
                                        <div
                                            className="h-full rounded-md bg-green-400 transition-all"
                                            style={{ width: "100%" }}
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500 dark:text-[#82717b]">
                                        Target balance: {currency(targetBalance)}
                                    </p>
                                </div>
                            ) : isInProfit ?
                                (<div>
                                    <div className="mb-2 flex items-center justify-between text-sm">
                                        <span className="text-gray-500 flex gap-1 dark:text-[#82717b]">
                                            <p>Profit Target :</p>
                                            <p className="flex  items-center"> <DollarSign size={14} /> {target}</p>
                                        </span>
                                        <span className="font-bold">

                                            {targetAchivedPercent.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-md bg-gray-200 dark:bg-[#3b353c]">
                                        <div
                                            className="h-full rounded-md bg-green-400 transition-all"
                                            style={{ width: `${targetProgress}%` }}
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500 dark:text-[#82717b]">
                                        Target balance: {currency(account.targetValue! + target)}
                                    </p>
                                </div>)
                                :
                                (<div>
                                    <div className="mb-2 flex items-center justify-between text-sm">
                                        <span className="text-gray-500 flex gap-1 dark:text-[#82717b]">
                                            <p>Max drawdown :</p>
                                            <p className="flex  items-center"> <DollarSign size={14} /> {target}</p>
                                        </span>
                                        <span className="font-bold">
                                            {targetAchivedPercent.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-md bg-gray-200 dark:bg-[#3b353c]">
                                        <div
                                            className={`h-full rounded-md  transition-all bg-red-400  `}
                                            style={{ width: `${Math.abs(targetAchivedPercent)}%` }}
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500 dark:text-[#82717b]">
                                        Minimum balance: {currency(account.targetValue! - target)}
                                    </p>
                                </div>)

                            }
                            <div className="space-y-3 border-t border-gray-300 pt-5 dark:border-[#3b353c]">
                                {Array.from({ length: totalSteps }, (_, index) => {
                                    const step = index + 1;
                                    // S1-passed (currentStep=2, active): only step 1 green.
                                    // Final passed: both green. Never both green on stage transition.
                                    const completed = isAllPassed || step < currentStep;
                                    const active = !isAllPassed && step === currentStep;
                                    return (
                                        <div key={step} className="flex items-center gap-3">
                                            <span
                                                className={`grid size-7 place-items-center rounded-full text-xs font-bold ${completed
                                                    ? "bg-green-500 text-white dark:bg-green-600"
                                                    : active
                                                        ? "bg-purple-500 text-white dark:bg-[#a855f7]"
                                                        : "bg-gray-200 text-gray-500 dark:bg-[#3b353c] dark:text-[#82717b]"
                                                    }`}
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
                                                            ? (myChallenge.status?.hasApiKey === true ? "In progress" : "Ready to start")
                                                            : "Locked"}
                                                </p>
                                            </div>
                                            {active && (
                                                <Badge className="bg-purple-500 text-white hover:bg-purple-500 dark:bg-[#a855f7]">
                                                    {myChallenge.status?.hasApiKey === true ? "Trading" : "Action Required"}
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
                                        {challenge?.drawdown ?? "—"}%
                                    </span>
                                </div>
                                <div className="mt-3 flex justify-between">
                                    <span className="text-gray-500 dark:text-[#82717b]">
                                        Available balance
                                    </span>
                                    <span className="font-bold">
                                        {hasPassedPreviousStep
                                            ? currency(targetBalance)
                                            : isReadOnlyPast
                                              ? currency(
                                                    Number(
                                                        myChallenge.status
                                                            ?.currentBalance,
                                                    ) || startingBalance,
                                                )
                                              : currency(account.equity)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>




            </div>

            <ApiKeyModal
                challengeId={challenge?.id ?? (id as string)}
                challengeTitle={challenge?.title ?? "Challenge"}
                purchaseId={myChallenge.purchase_id}
                stepNumber={currentStep}
                isOpen={showApiKeyModal && !isReadOnlyPast}
                onClose={() => setShowApiKeyModal(false)}
                onComplete={handleApiKeyComplete}
            />

            <AuthPromptModal
                isOpen={showAuthModal}
                onClose={() => router.push("/auth/signin")}
            />
        </main>
    );
}
