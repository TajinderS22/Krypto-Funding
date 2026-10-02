"use client";

import { Award, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { STATIC_FAIL_COPY, getStaticPastDetail } from "@/lib/pastChallengeStatic";
import type { MyChallenge } from "@/lib/types";

const money0 = (v: number | null | undefined) =>
  v === null || v === undefined
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(v);

export function FailReasonCard({ item }: { item: MyChallenge }) {
  const detail = getStaticPastDetail(item);
  const copy = STATIC_FAIL_COPY[detail?.failedReasonCode ?? "DRAWDOWN_BREACH"];
  return (
    <Card className="rounded-md border-red-500/25 bg-red-500/5 py-0 dark:border-red-500/25">
      <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-red-500/15 text-red-600 dark:text-red-400">
            <XCircle className="size-5" />
          </span>
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-red-700 dark:text-red-300">
              {copy.title} — static placeholder
            </p>
            <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-[#82717b]">
              {copy.body}
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-[#82717b]">
              Final balance: {money0(detail?.breachedValue)}
              {detail?.decidedAt
                ? ` · Ended ${new Date(detail.decidedAt).toLocaleDateString()}`
                : ""}
              {" · TODO(past-fetch): wire real breach reason + timestamp."}
            </p>
          </div>
        </div>
        <Badge variant="destructive" className="shrink-0">
          Failed
        </Badge>
      </CardContent>
    </Card>
  );
}

export function PassCertificate({ item }: { item: MyChallenge }) {
  const detail = getStaticPastDetail(item);
  return (
    <Card className="rounded-md border-amber-400/30 bg-gradient-to-br from-amber-400/10 via-white to-purple-500/10 py-0 dark:border-[#fbbf24]/30 dark:from-[#fbbf24]/10 dark:via-[#090909] dark:to-[#a855f7]/10">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-amber-400 text-white dark:bg-[#fbbf24] dark:text-[#090909]">
            <Award className="size-5" />
          </span>
          <div>
            <p className="text-sm font-black uppercase tracking-widest">
              Challenge passed — {item.challenge.title}{" "}
              {money0(item.challenge.value)}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-[#82717b]">
              Certificate {detail?.certificateId ?? "—"}
              {detail?.decidedAt
                ? ` · ${new Date(detail.decidedAt).toLocaleDateString()}`
                : ""}
              {" · Static placeholder."}
            </p>
          </div>
        </div>
        {/* TODO(past-fetch): enable download when backend issues real certificates. */}
        <Button
          disabled
          variant="outline"
          className="rounded-md font-bold uppercase tracking-widest"
        >
          Download (soon)
        </Button>
      </CardContent>
    </Card>
  );
}
