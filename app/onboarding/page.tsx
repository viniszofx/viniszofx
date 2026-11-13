import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { auth } from "@/lib/auth/server";
import { hasAuthUsers } from "@/lib/auth/users";
import { canOnboard, hasMembership, signupOpen } from "@/lib/organizations/onboarding";

export const metadata: Metadata = { title: "Criar conta | Viniccius", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OnboardingRoute() {
  const { data } = await auth.getSession();
  if (data?.user) {
    if (await canOnboard(data.user.id)) return <OnboardingWizard userName={data.user.name ?? ""} firstAccount={false} />;
    redirect(await hasMembership(data.user.id) ? "/dashboard" : "/access-required");
  }
  const firstAccount = !await hasAuthUsers();
  // Sem cadastro aberto, só a primeira conta passa por aqui.
  if (!firstAccount && !signupOpen()) redirect("/login");
  return <OnboardingWizard userName={null} firstAccount={firstAccount} />;
}
