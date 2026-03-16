"use client";

import { ToggleCards } from "@/components/onboarding/ToggleCards";
import { CurrencyInput } from "@/components/onboarding/CurrencyInput";
import { PROVINCES, type ProfileData } from "@/lib/schemas/onboarding";

interface Props {
  data: ProfileData;
  onChange: (data: ProfileData) => void;
  errors: Record<string, string>;
}

export function Step1Profile({ data, onChange, errors }: Props) {
  const update = (patch: Partial<ProfileData>) =>
    onChange({ ...data, ...patch });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Let&apos;s get to know you</h2>
        <p className="mt-1 text-sm text-gray-500">
          This helps us personalize your plan.
        </p>
      </div>

      {/* Plan type */}
      <div>
        <p className="label">Is this plan for just you, or for you and a partner?</p>
        <ToggleCards
          value={data.planType}
          onChange={(v) => update({ planType: v as "INDIVIDUAL" | "COUPLE" })}
          options={[
            {
              value: "INDIVIDUAL",
              label: "Just me",
              icon: (
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              ),
            },
            {
              value: "COUPLE",
              label: "Me & my partner",
              icon: (
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              ),
            },
          ]}
        />
      </div>

      {/* Name + DOB */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="label">Your first name</label>
          <input
            id="firstName"
            type="text"
            value={data.firstName}
            onChange={(e) => update({ firstName: e.target.value })}
            className={`input ${errors.firstName ? "border-red-400" : ""}`}
            placeholder="e.g. Sarah"
          />
          {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
        </div>
        <div>
          <label htmlFor="dob" className="label">Date of birth</label>
          <input
            id="dob"
            type="date"
            value={data.dateOfBirth}
            onChange={(e) => update({ dateOfBirth: e.target.value })}
            className={`input ${errors.dateOfBirth ? "border-red-400" : ""}`}
          />
          {errors.dateOfBirth && <p className="mt-1 text-xs text-red-500">{errors.dateOfBirth}</p>}
        </div>
      </div>

      {/* Province */}
      <div>
        <label htmlFor="province" className="label">Which province do you live in?</label>
        <select
          id="province"
          value={data.province || ""}
          onChange={(e) => update({ province: e.target.value as ProfileData["province"] })}
          className={`input ${errors.province ? "border-red-400" : ""}`}
        >
          <option value="" disabled>Select a province</option>
          {PROVINCES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-400">Used for accurate tax calculations.</p>
        {errors.province && <p className="mt-1 text-xs text-red-500">{errors.province}</p>}
      </div>

      {/* Partner (conditional) */}
      {data.planType === "COUPLE" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-teal/20 bg-teal/5 p-4">
          <div>
            <label htmlFor="partnerName" className="label">Partner&apos;s first name</label>
            <input
              id="partnerName"
              type="text"
              value={data.partnerName || ""}
              onChange={(e) => update({ partnerName: e.target.value })}
              className={`input ${errors.partnerName ? "border-red-400" : ""}`}
              placeholder="e.g. James"
            />
            {errors.partnerName && <p className="mt-1 text-xs text-red-500">{errors.partnerName}</p>}
          </div>
          <div>
            <label htmlFor="partnerDob" className="label">Partner&apos;s date of birth</label>
            <input
              id="partnerDob"
              type="date"
              value={data.partnerDateOfBirth || ""}
              onChange={(e) => update({ partnerDateOfBirth: e.target.value })}
              className={`input ${errors.partnerDateOfBirth ? "border-red-400" : ""}`}
            />
            {errors.partnerDateOfBirth && <p className="mt-1 text-xs text-red-500">{errors.partnerDateOfBirth}</p>}
          </div>
        </div>
      )}

      {/* Retirement targets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="retireAge" className="label">Ideal retirement age</label>
          <input
            id="retireAge"
            type="number"
            min={30}
            max={100}
            value={data.retirementTargetAge || ""}
            onChange={(e) => update({ retirementTargetAge: parseInt(e.target.value) || 0 })}
            className={`input ${errors.retirementTargetAge ? "border-red-400" : ""}`}
            placeholder="65"
          />
          {errors.retirementTargetAge && <p className="mt-1 text-xs text-red-500">{errors.retirementTargetAge}</p>}
        </div>
        <div>
          <label htmlFor="deathAge" className="label">Project until age</label>
          <input
            id="deathAge"
            type="number"
            min={60}
            max={120}
            value={data.deathAge || ""}
            onChange={(e) => update({ deathAge: parseInt(e.target.value) || 100 })}
            className="input"
            placeholder="100"
          />
          <p className="mt-1 text-xs text-gray-400">Default: 100</p>
        </div>
        <CurrencyInput
          id="amountToDieWith"
          label="Amount to leave behind"
          value={data.amountToDieWith}
          onChange={(v) => update({ amountToDieWith: v })}
          helpText="Safety net / legacy. Default: $100,000"
        />
      </div>
    </div>
  );
}
