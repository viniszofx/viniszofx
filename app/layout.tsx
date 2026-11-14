import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { JetBrains_Mono, Oxanium, Raleway } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { siteUrl } from "@/lib/seo/site-url";

const oxanium = Oxanium({
  subsets: ["latin"],
  variable: "--font-oxanium",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

const ralewayHeading = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Vinicius Souza | Analista de Sistemas",
  description:
    "Analista de Sistemas, Desenvolvedor Web e Mobile, apaixonado por tecnologia e inovação. Com experiência em desenvolvimento de software, busco constantemente aprimorar minhas habilidades e contribuir para projetos desafiadores.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Tema escolhido pela pessoa (cookie); sem escolha, o CSS segue o tema do aparelho.
  const theme = (await cookies()).get("viniszofx-theme")?.value;
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={cn(
        "h-full font-sans antialiased",
        theme === "dark" && "dark",
        theme === "light" && "light",
        jetbrainsMono.variable,
        oxanium.variable,
        ralewayHeading.variable,
      )}
    >
      <body className="flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}
