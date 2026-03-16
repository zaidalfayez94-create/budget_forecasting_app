"use client";

import posthog from "posthog-js";

/**
 * Centralised analytics module.
 * Never call posthog.capture() directly — always use these typed functions.
 */

export function trackSignup({
  userId,
  province,
  planType,
}: {
  userId: string;
  province: string;
  planType: string;
}) {
  posthog.capture("signup", { userId, province, planType });
}

export function trackOnboardingStep({
  userId,
  step,
  stepName,
}: {
  userId: string;
  step: number;
  stepName: string;
}) {
  posthog.capture("onboarding_step", { userId, step, stepName });
}

export function trackOnboardingCompleted({
  userId,
  timeToCompleteMs,
}: {
  userId: string;
  timeToCompleteMs: number;
}) {
  posthog.capture("onboarding_completed", { userId, timeToCompleteMs });
}

export function trackPlanCalculated({
  userId,
  firstRetirementAge,
  targetRetirementAge,
}: {
  userId: string;
  firstRetirementAge: number | null;
  targetRetirementAge: number;
}) {
  posthog.capture("plan_calculated", {
    userId,
    firstRetirementAge,
    targetRetirementAge,
  });
}

export function trackScenarioCreated({
  userId,
  scenarioCount,
}: {
  userId: string;
  scenarioCount: number;
}) {
  posthog.capture("scenario_created", { userId, scenarioCount });
}

export function trackScenarioCompared({
  userId,
  scenariosCompared,
}: {
  userId: string;
  scenariosCompared: number;
}) {
  posthog.capture("scenario_compared", { userId, scenariosCompared });
}

export function trackDashboardViewed({ userId }: { userId: string }) {
  posthog.capture("dashboard_viewed", { userId });
}

export function trackAssumptionEdited({
  userId,
  assumption,
}: {
  userId: string;
  assumption: string;
}) {
  posthog.capture("assumption_edited", { userId, assumption });
}
