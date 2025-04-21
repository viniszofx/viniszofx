"use client";

import { ChevronDown, Github, Twitter, Linkedin, Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/context/language-context";

export function Hero() {
  const { t } = useLanguage();

  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 md:px-6 relative overflow-hidden">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex justify-center">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-black shadow-lg">
            <Image
              src="https://github.com/viniszofx.png"
              alt="Vinicius Souza"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
        <h1 className="text-4xl md:text-7xl font-bold tracking-tight mb-4">
          Vinicius Souza
        </h1>
        <p className="text-md md:text-2xl text-neutral-500 dark:text-neutral-400 mb-4 max-w-xl mx-auto">
          {t("hero.subtitle")}
        </p>
        <p className="text-md text-neutral-600 dark:text-neutral-300 mb-8 max-w-2xl mx-auto">
          {t("hero.description")}
        </p>

        <div className="flex justify-center gap-4 mb-8">
          <Link
            href="https://github.com/viniszofx"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 w-10 h-10 transition-colors"
            aria-label="GitHub"
          >
            <Github className="h-5 w-5" />
          </Link>
          <Link
            href="https://linkedin.com/in/viniszofx"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 w-10 h-10 transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin className="h-5 w-5" />
          </Link>
          <Link
            href="mailto:contato@viniccius.com.br"
            className="inline-flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 w-10 h-10 transition-colors"
            aria-label="Email"
          >
            <Mail className="h-5 w-5" />
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="#contact"
            className="inline-flex items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 h-12 px-8 text-base font-medium transition-colors"
          >
            {t("hero.getInTouch")}
          </Link>
          <Link
            href="#projects"
            className="inline-flex items-center justify-center rounded-full border border-black/20 dark:border-white/20 bg-transparent text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 h-12 px-8 text-base font-medium transition-colors"
          >
            {t("hero.viewProjects")}
          </Link>
        </div>
      </div>
      <div className="absolute bottom-8 left-0 right-0 flex justify-center animate-bounce">
        <Link
          href="#about"
          className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ChevronDown className="h-8 w-8" />
        </Link>
      </div>
    </section>
  );
}
