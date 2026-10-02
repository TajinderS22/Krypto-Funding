"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    Check,
    ChevronDown,
    ChevronUp,
    LayoutGrid,
    Loader2,
    Shield,
    XCircle,
} from "lucide-react";
import api from "@/lib/axios";
import AuthPromptModal from "@/components/app/AuthPromptModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isFullyPassed, isPartiallyPassed } from "@/lib/challengePhase";
import type { MyChallenge } from "@/lib/types";

type ChallengeGroups = {
    active: MyChallenge[];
    failed: MyChallenge[];
    passed: MyChallenge[];
};

const money = (value: number | null | undefined) =>
    value === null || value === undefined
        ? "—"
        : new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(value);

export default function DashboardPage() {
    const [myChallenges, setMyChallenges] = useState<ChallengeGroups>({
        active: [],
        failed: [],
        passed: [],
    });
    const [isLoading, setIsLoading] = useState(true);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showFailed, setShowFailed] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const response = await api.get("/user/challenges/my-challenges");
                setMyChallenges(response.data as ChallengeGroups);
            } catch (requestError: unknown) {
                const axiosError = requestError as { response?: { status?: number } };
                if (axiosError.response?.status === 401) setShowAuthModal(true);
                else if (axiosError.response?.status !== 404)
                    console.error("Could not load dashboard", requestError);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);


    const active = myChallenges.active || [];
    const passedBucket = myChallenges.passed || [];
    const failed = myChallenges.failed || [];

    // Passed ONLY when fully passed (both steps done + final keys submitted).
    // Legacy/mis-grouped passed rows without final keys stay in-progress.
    const completed = passedBucket.filter(isFullyPassed);
    const passedNotDone = passedBucket.filter((item) => !isFullyPassed(item));
    const inProgress = [...active, ...passedNotDone];


    if (isLoading)
        return (
            <div className="grid min-h-[70vh] place-items-center">
                <Loader2 className="size-6 animate-spin text-amber-400 dark:text-[#fbbf24]" />
            </div>
        );

    return (
        <main className="min-h-screen bg-white pb-14 dark:bg-[#090909]">
            <div className="border-b border-gray-300 bg-gradient-to-br from-purple-50 via-white to-amber-50 dark:border-[#3b353c] dark:from-[#a855f7]/10 dark:via-[#090909] dark:to-[#fbbf24]/10">
                <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
                    <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
                        <div>
                            <Badge className="mb-4 bg-purple-500 text-white hover:bg-purple-500 dark:bg-[#a855f7]">
                                <Activity />
                                Challenge workspace
                            </Badge>
                            <h1 className="text-3xl font-black uppercase tracking-tighter sm:text-4xl">
                                Your trading dashboard
                            </h1>
                            <p className="mt-3 max-w-xl text-gray-500 dark:text-[#82717b]">
                                Keep an eye on your active evaluations and move through each
                                stage with confidence.
                            </p>
                        </div>
                        <Button
                            asChild
                            className="h-auto rounded-md bg-amber-400 px-6 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-gray-900 dark:bg-[#fbbf24] dark:text-[#090909] dark:hover:bg-[#c1cfc1]"
                        >
                            <Link href="/challenges">
                                <LayoutGrid />
                                Explore challenges
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl space-y-9 px-5 py-8 sm:px-8">
                <section className="grid gap-4 sm:grid-cols-3">
                    <Card className="rounded-md border-purple-200 bg-purple-50/60 py-0 shadow-none dark:border-[#a855f7]/20 dark:bg-[#a855f7]/10">
                        <CardContent className="p-5">
                            <p className="text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-[#a855f7]">
                                Active challenges
                            </p>
                            <p className="mt-2 text-3xl font-black text-purple-950 dark:text-[#c1cfc1]">
                                {inProgress.length}
                            </p>
                            <p className="mt-1 text-xs text-purple-600/70 dark:text-[#82717b]">
                                Evaluations in progress
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-md border-amber-200 bg-amber-50/60 py-0 shadow-none dark:border-[#fbbf24]/20 dark:bg-[#fbbf24]/10">
                        <CardContent className="p-5">
                            <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-[#fbbf24]">
                                Completed
                            </p>
                            <p className="mt-2 text-3xl font-black text-amber-950 dark:text-[#c1cfc1]">
                                {completed.length}
                            </p>
                            <p className="mt-1 text-xs text-amber-700/70 dark:text-[#82717b]">
                                Successful evaluations
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-md border-gray-300 bg-gray-50 py-0 shadow-none dark:border-[#3b353c] dark:bg-[#0c0c0c]">
                        <CardContent className="p-5">
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-[#82717b]">
                                Past challenges
                            </p>
                            <p className="mt-2 text-3xl font-black text-gray-950 dark:text-[#c1cfc1]">
                                {failed.length}
                            </p>
                            <p className="mt-1 text-xs text-gray-700/70 dark:text-[#82717b]">
                                Available to review
                            </p>
                        </CardContent>
                    </Card>
                </section>

                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter">
                                Active challenges
                            </h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-[#82717b]">
                                Continue where you left off.
                            </p>
                        </div>
                        <Badge
                            variant="outline"
                            className="border-amber-300 bg-amber-50 text-amber-700 dark:border-[#fbbf24]/30 dark:bg-[#fbbf24]/10 dark:text-[#fbbf24]"
                        >
                            {inProgress.length} active
                        </Badge>
                    </div>
                    {inProgress.length ? (
                        <div className="grid gap-4 lg:grid-cols-2">
                            {inProgress.map((item) => {
                                const challenge = item.challenge;
                                const currentStep = item.status?.currentStep ?? 1;
                                const steps = item.status?.steps ?? challenge.steps ?? 1;

                                const hasPassedPreviousStep =
                                    currentStep > 1 &&
                                    currentStep <= steps &&
                                    item.status?.hasApiKey !== true;
                                // Stage ≥1 passed, current stage running with keys.
                                const isPartialRunning =
                                    isPartiallyPassed(item) &&
                                    item.status?.hasApiKey === true;
                                const target =
                                    ((item.challenge.target ?? 0) *
                                        (item.challenge.value ?? 0)) /
                                    100;
                                const currentBalance = Number(
                                    item.status?.currentBalance,
                                );
                                const rawProgress =
                                    Number.isFinite(currentBalance) &&
                                        target > 0
                                        ? ((currentBalance -
                                            (item.challenge.value ?? 0)) /
                                            target) *
                                        100
                                        : 0;
                                // Frozen 100% for Stage-1-passed; clamped live value otherwise.
                                const progress = hasPassedPreviousStep
                                    ? 100
                                    : Math.max(0, Math.min(100, rawProgress));


                                return (
                                    <Card
                                        key={item.purchase_id}
                                        className="group bg-white dark:bg-[#0c0a16] rounded-md border-gray-300 overflow-hidden py-0 shadow-sm transition-shadow hover:shadow-md dark:border-[#3b353c]"
                                    >
                                        <CardContent className="p-0">
                                            <div className="p-5">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        {hasPassedPreviousStep ? (
                                                            <Badge className="bg-amber-400 text-white hover:bg-amber-400 dark:bg-[#fbbf24] dark:text-[#090909]">
                                                                <span className="size-1.5 animate-pulse rounded-md bg-white dark:bg-[#090909]" />
                                                                In progress · Stage {currentStep - 1} of {steps} done
                                                            </Badge>
                                                        ) : isPartialRunning ? (
                                                            <Badge className="bg-purple-500 text-white hover:bg-purple-500 dark:bg-[#a855f7]">
                                                                <span className="size-1.5 animate-pulse rounded-md bg-white dark:bg-[#090909]" />
                                                                Partially passed · Stage {currentStep} of {steps}
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-amber-400 text-white hover:bg-amber-400 dark:bg-[#fbbf24] dark:text-[#090909]">
                                                                <span className="size-1.5 rounded-md bg-white dark:bg-[#090909]" />
                                                                Active
                                                            </Badge>
                                                        )}

                                                        <h3 className="mt-4 text-xl font-black uppercase tracking-tighter">
                                                            {challenge.title}
                                                        </h3>
                                                        <p className="mt-1 text-sm text-gray-500 dark:text-[#82717b]">
                                                            {money(challenge.value)} account
                                                        </p>
                                                    </div>
                                                    <Button
                                                        asChild
                                                        size="icon"
                                                        variant="outline"
                                                        className="rounded-md border-gray-300 text-purple-500  group-hover:text-white dark:border-[#3b353c] dark:hover:text-white dark:text-[#a855f7] dark:group-hover:text-black dark:group-hover:bg-[#a855f7]"
                                                    >
                                                        <Link
                                                            href={`/client/dashboard/challenge/${challenge.id}?purchase=${item.purchase_id}`}
                                                            aria-label={`Open ${challenge.title}`}
                                                        >
                                                            <ArrowRight />
                                                        </Link>
                                                    </Button>
                                                </div>
                                                <div className="mt-6 grid grid-cols-3 gap-3 border-y border-gray-300 py-4 text-sm dark:border-[#3b353c]">
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-[#82717b]">
                                                            Stage
                                                        </p>
                                                        <p className="mt-1 font-bold">
                                                            {currentStep} of {steps}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-[#82717b]">
                                                            Target
                                                        </p>
                                                        <p className="mt-1 font-bold text-amber-400 dark:text-[#fbbf24]">
                                                            {challenge.target ?? "—"}%
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-[#82717b]">
                                                            Drawdown
                                                        </p>
                                                        <p className="mt-1 font-bold text-purple-500 dark:text-[#a855f7]">
                                                            {challenge.drawdown ?? "—"}%
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-4">
                                                    <div className="mb-2 flex justify-between text-xs">
                                                        <span className="text-gray-500 dark:text-[#82717b]">
                                                            Stage progress
                                                        </span>
                                                        <span className="font-bold text-purple-500 dark:text-[#a855f7]">
                                                            {hasPassedPreviousStep
                                                                ? `Stage ${currentStep - 1} done · awaiting Stage ${currentStep} keys`
                                                                : isPartialRunning
                                                                    ? `Stage ${currentStep} in progress · ${Math.round(progress)}%`
                                                                    : item.status?.hasApiKey === true
                                                                        ? `${Math.round(progress)}%`
                                                                        : "API Key Required"}
                                                        </span>

                                                    </div>
                                                    <div className="h-2 overflow-hidden rounded-md flex bg-gray-200 dark:bg-[#3b353c]">
                                                        {hasPassedPreviousStep ? (
                                                            <div
                                                                className="h-full rounded-md bg-green-400"
                                                                style={{ width: "100%" }}
                                                            />
                                                        ) : rawProgress < 0 ? (
                                                            <div
                                                                className="h-full rounded-md bg-red-400"
                                                                style={{
                                                                    width: `${Math.min(100, Math.abs(rawProgress))}%`,
                                                                }}
                                                            />
                                                        ) : (
                                                            <div
                                                                className="h-full rounded-md bg-green-400"
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <Card className="rounded-md border-dashed border-gray-300 py-0 dark:border-[#3b353c]">
                            <CardContent className="grid min-h-64 place-items-center p-6 text-center">
                                <div>
                                    <span className="mx-auto grid size-12 place-items-center rounded-full bg-purple-100 text-purple-500 dark:bg-[#a855f7]/15 dark:text-[#a855f7]">
                                        <Shield className="size-5" />
                                    </span>
                                    <h3 className="mt-4 font-black uppercase tracking-tighter">
                                        No active challenge yet
                                    </h3>
                                    <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-[#82717b]">
                                        Choose an evaluation that fits your trading style to get
                                        started.
                                    </p>
                                    <Button
                                        asChild
                                        className="mt-5 rounded-md bg-amber-400 text-sm font-black uppercase tracking-widest text-white hover:bg-gray-900 dark:bg-[#fbbf24] dark:text-[#090909] dark:hover:bg-[#c1cfc1]"
                                    >
                                        <Link href="/challenges">Browse challenges</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </section>

                {failed.length > 0 && (
                    <section>
                        <button
                            onClick={() => setShowFailed((open) => !open)}
                            className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white p-4 text-left transition-colors hover:bg-gray-50 dark:border-[#3b353c] dark:bg-[#090909] dark:hover:bg-[#0c0c0c]"
                        >
                            <div className="flex items-center gap-3">
                                <span className="grid size-9 place-items-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                                    <XCircle className="size-4" />
                                </span>
                                <div>
                                    <h2 className="font-black uppercase tracking-tighter">
                                        Past challenges
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-[#82717b]">
                                        {failed.length} evaluation{failed.length === 1 ? "" : "s"}{" "}
                                        to review
                                    </p>
                                </div>
                            </div>
                            {showFailed ? (
                                <ChevronUp className="text-gray-500 dark:text-[#82717b]" />
                            ) : (
                                <ChevronDown className="text-gray-500 dark:text-[#82717b]" />
                            )}
                        </button>
                        {showFailed && (
                            <div className="mt-3 space-y-3">
                                {failed.map((item) => (
                                    <Card
                                        key={item.purchase_id}
                                        className="rounded-md border-red-200 py-0 shadow-none dark:border-red-500/20"
                                    >
                                        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-3">
                                                <AlertTriangle className="size-4 text-red-600 dark:text-red-400" />
                                                <div>
                                                    <p className="font-bold uppercase tracking-widest">
                                                        {item.challenge.title}
                                                    </p>
                                                    <p className="mt-1 text-sm text-gray-500 dark:text-[#82717b]">
                                                        {money(item.challenge.value)} · Target{" "}
                                                        {item.challenge.target ?? "—"}% · Drawdown{" "}
                                                        {item.challenge.drawdown ?? "—"}% · Step{" "}
                                                        {item.status?.currentStep ?? 1} of{" "}
                                                        {item.status?.steps ??
                                                            item.challenge.steps ??
                                                            1}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="destructive">
                                                    Failed
                                                </Badge>
                                                <Button
                                                    asChild
                                                    size="icon"
                                                    variant="outline"
                                                    className="rounded-md"
                                                    aria-label={`Open ${item.challenge.title}`}
                                                >
                                                    <Link
                                                        href={`/client/dashboard/challenge/${item.challenge.id}?purchase=${item.purchase_id}`}
                                                    >
                                                        <ArrowRight />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {completed.length > 0 && (
                    <section>
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tighter">
                                    Completed
                                </h2>
                                <p className="mt-1 text-sm text-gray-500 dark:text-[#82717b]">
                                    Passed evaluations with certificates.
                                </p>
                            </div>
                            <Badge
                                variant="outline"
                                className="border-green-300 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400"
                            >
                                {completed.length} passed
                            </Badge>
                        </div>
                        <div className="space-y-3">
                            {completed.map((item) => (
                                <Card
                                    key={item.purchase_id}
                                    className="rounded-md border-green-200 py-0 shadow-none dark:border-green-500/20"
                                >
                                    <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="grid size-9 place-items-center rounded-full bg-green-500/15 text-green-600 dark:text-green-400">
                                                <Check className="size-4" />
                                            </span>
                                            <div>
                                                <p className="font-bold uppercase tracking-widest">
                                                    {item.challenge.title}
                                                </p>
                                                <p className="mt-1 text-sm text-gray-500 dark:text-[#82717b]">
                                                    {money(item.challenge.value)} · Target{" "}
                                                    {item.challenge.target ?? "—"}% ·{" "}
                                                    {item.status?.steps ??
                                                        item.challenge.steps ??
                                                        1}
                                                    -step
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-green-500 text-white hover:bg-green-500">
                                                Passed
                                            </Badge>
                                            <Button
                                                asChild
                                                size="icon"
                                                variant="outline"
                                                className="rounded-md"
                                                aria-label={`Open ${item.challenge.title}`}
                                            >
                                                <Link
                                                    href={`/client/dashboard/challenge/${item.challenge.id}?purchase=${item.purchase_id}`}
                                                >
                                                    <ArrowRight />
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}
            </div>
            <AuthPromptModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />
        </main>
    );
}
