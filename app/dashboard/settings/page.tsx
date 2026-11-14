import type { Metadata } from "next";
import { ProfileSettings } from "./profile/profile-settings";

export const metadata: Metadata = { title: "Ajustes | Viniccius" };

export default function SettingsPage() {
  return <ProfileSettings menu />;
}
