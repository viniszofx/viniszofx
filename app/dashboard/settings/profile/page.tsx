import type { Metadata } from "next";
import { ProfileSettings } from "./profile-settings";

export const metadata: Metadata = { title: "Perfil | Ajustes" };

export default function ProfileSettingsPage() {
  return <ProfileSettings />;
}
