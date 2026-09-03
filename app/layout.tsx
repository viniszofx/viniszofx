import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import {  JetBrains_Mono, Public_Sans } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});


const publicSansHeading = Public_Sans({subsets:['latin'],variable:'--font-heading'});

export const metadata: Metadata = {
  title: "Vinicius Souza | Analista de Sistemas",
  description:
    "Analista de Sistemas, Desenvolvedor Web e Mobile, apaixonado por tecnologia e inovação. Com experiência em desenvolvimento de software, busco constantemente aprimorar minhas habilidades e contribuir para projetos desafiadores.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", jetbrainsMono.variable, publicSansHeading.variable)}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
