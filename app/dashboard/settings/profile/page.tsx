import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema/app";
import { eq } from "drizzle-orm";
import { ProfileForms } from "./profile-forms";

export const metadata: Metadata = { title: "Perfil | Viniccius" };

export default async function ProfileSettingsPage() {
  const { data } = await auth.getSession();
  if (!data?.user) redirect("/login");
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, data.user.id)).limit(1);
  return <main className="flex w-full flex-col gap-7 px-4 pb-12 pt-6 sm:px-7">
    <div className="border-b pb-5">
      <Link href="/dashboard/settings" className="mb-2 block text-xs text-muted-foreground hover:text-primary">Console / Configurações</Link>
      <h1 className="text-2xl font-semibold">Perfil</h1>
      <p className="mt-1 text-sm text-muted-foreground">Seus dados de acesso e identificação no painel.</p>
    </div>
    <div className="max-w-4xl"><ProfileForms name={data.user.name ?? ""} email={data.user.email} image={profile?.avatarFileId ? `/api/profile/avatar/${data.user.id}?v=${profile.avatarFileId.slice(0, 8)}` : data.user.image} username={profile?.username ?? ""} bio={profile?.bio ?? ""} /></div>
  </main>;
}
