import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { JetBrains_Mono, Oxanium, Raleway } from "next/font/google";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={cn(
        "h-full font-sans antialiased",
        jetbrainsMono.variable,
        oxanium.variable,
        ralewayHeading.variable,
      )}
    >
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('viniszofx:theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}})()` }} />
        {children}
      </body>
    </html>
  );
}
