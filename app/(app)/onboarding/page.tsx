import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { OnboardingWizard } from "./OnboardingWizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // If user already has a base plan, go straight to dashboard
  try {
    const existingPlan = await prisma.financialPlan.findFirst({
      where: { userId: user.id, isBasePlan: true },
      select: { id: true },
    });
    if (existingPlan) redirect("/dashboard");
  } catch {
    // DB not migrated yet — allow through
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <OnboardingWizard user={user} />
    </div>
  );
}
