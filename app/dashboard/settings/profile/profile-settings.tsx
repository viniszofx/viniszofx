import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema/app";
import { ProfileForms } from "./profile-forms";

/** Perfil e senha; também é a tela de entrada dos Ajustes (no celular, `menu` abre antes a lista de seções). */
export async function ProfileSettings({ menu = false }: { menu?: boolean }) {
  const { data } = await auth.getSession();
  if (!data?.user) redirect("/login");
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, data.user.id)).limit(1);
  return <SettingsLayout menu={menu} title="Perfil e senha" description="Seu nome, foto, usuário e senha de acesso.">
    <div className="max-w-4xl"><ProfileForms name={data.user.name ?? ""} email={data.user.email} image={profile?.avatarFileId ? `/api/profile/avatar/${data.user.id}?v=${profile.avatarFileId.slice(0, 8)}` : data.user.image} username={profile?.username ?? ""} bio={profile?.bio ?? ""} /></div>
  </SettingsLayout>;
}
