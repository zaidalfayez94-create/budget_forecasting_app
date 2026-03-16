"use client";

import { useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { trackDashboardViewed } from "@/lib/analytics/events";

interface BasePlan {
  id: string;
  name: string;
  firstRetirementAge: number | null;
  targetRetirementAge: number;
  updatedAt: Date;
}

interface Props {
  user: User;
  basePlan: BasePlan | null;
}

export function DashboardClient({ user, basePlan }: Props) {
  useEffect(() => {
    trackDashboardViewed({ userId: user.id });
  }, [user.id]);

  if (!basePlan) {
    return <NoPlanState />;
  }

  return <PlanSummary plan={basePlan} />;
}

// ─── No plan yet ─────────────────────────────────────────────────────────────

function NoPlanState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Illustration */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-teal/10">
        <svg
          className="h-10 w-10 text-teal"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        Let&apos;s build your financial plan
      </h1>
      <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
        Answer a few questions about your income, savings, and goals — and
        Clearpath will model exactly when you can retire.
      </p>

      <a href="/onboarding" className="btn-primary text-base px-8 py-3">
        Start
      </a>
    </div>
  );
}

// ─── Plan summary ─────────────────────────────────────────────────────────────

function PlanSummary({ plan }: { plan: BasePlan }) {
  const gap =
    plan.firstRetirementAge != null
      ? plan.firstRetirementAge - plan.targetRetirementAge
      : null;

  const gapLabel =
    gap == null
      ? "—"
      : gap === 0
      ? "On track"
      : gap < 0
      ? `${Math.abs(gap)} years early`
      : `${gap} years late`;

  const gapColor =
    gap == null
      ? "text-gray-400"
      : gap <= 0
      ? "text-teal"
      : "text-amber-500";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Last updated{" "}
          {new Intl.DateTimeFormat("en-CA", {
            dateStyle: "medium",
          }).format(new Date(plan.updatedAt))}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Achievable retirement age"
          value={
            plan.firstRetirementAge != null
              ? String(plan.firstRetirementAge)
              : "—"
          }
          valueColor="text-teal"
          sub="based on your plan"
        />
        <StatCard
          label="Target retirement age"
          value={String(plan.targetRetirementAge)}
          sub="from your profile"
        />
        <StatCard
          label="Gap"
          value={gapLabel}
          valueColor={gapColor}
          sub={
            gap == null
              ? "run a calculation"
              : gap <= 0
              ? "you're ahead of schedule"
              : "adjustments may help"
          }
        />
      </div>

      {/* CTA */}
      <div className="card flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900">
            Explore what-if scenarios
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            See how changing your savings rate, retirement date, or spending
            affects the plan.
          </p>
        </div>
        <a
          href="/scenarios"
          className="btn-secondary whitespace-nowrap flex-shrink-0"
        >
          View scenarios
        </a>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  valueColor = "text-gray-900",
  sub,
}: {
  label: string;
  value: string;
  valueColor?: string;
  sub: string;
}) {
  return (
    <div className="card">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
        {label}
      </p>
      <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}
