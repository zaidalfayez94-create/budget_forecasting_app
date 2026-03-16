import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Attempt to load the base plan for this user.
  // Gracefully handles the case where Prisma isn't migrated yet.
  let basePlan = null;
  try {
    basePlan = await prisma.financialPlan.findFirst({
      where: {
        userId: user!.id,
        isBasePlan: true,
      },
      select: {
        id: true,
        name: true,
        firstRetirementAge: true,
        targetRetirementAge: true,
        updatedAt: true,
      },
    });
  } catch {
    // DB not yet migrated — treat as no plan
  }

  return <DashboardClient user={user!} basePlan={basePlan} />;
}
