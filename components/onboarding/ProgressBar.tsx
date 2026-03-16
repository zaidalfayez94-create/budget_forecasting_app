"use client";

import { STEP_NAMES, TOTAL_STEPS } from "@/lib/schemas/onboarding";

interface ProgressBarProps {
  currentStep: number; // 0-indexed
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Step {currentStep + 1} of {TOTAL_STEPS}
        </span>
        <span className="text-sm font-medium text-teal">
          {STEP_NAMES[currentStep]}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal to-teal-light transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
