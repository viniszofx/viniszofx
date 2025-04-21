"use client";

import { Mail, Phone, Send } from "lucide-react";
import { useLanguage } from "@/context/language-context";

export function Contact() {
  const { t } = useLanguage();

  return (
    <section id="contact" className="py-24 px-4 md:px-6">
      <div className="container mx-auto max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12 text-center">
          {t("contact.title")}
        </h2>

        <div className="grid gap-12 md:grid-cols-2">
          <div className="space-y-8">
            <h3 className="text-2xl font-semibold">
              {t("contact.getInTouch")}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-neutral-400" />
                <p className="text-neutral-600 dark:text-neutral-300">
                  +55 67 9 9944-1458
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-neutral-400" />
                <p className="text-neutral-600 dark:text-neutral-300">
                  contato@viniccius.com.br
                </p>
              </div>
            </div>
          </div>

          <div>
            <form className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  {t("contact.name")}
                </label>
                <input
                  id="name"
                  placeholder={t("contact.namePlaceholder")}
                  className="w-full h-10 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  {t("contact.email")}
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder={t("contact.emailPlaceholder")}
                  className="w-full h-10 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  {t("contact.message")}
                </label>
                <textarea
                  id="message"
                  placeholder={t("contact.messagePlaceholder")}
                  className="w-full min-h-[120px] px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 h-12 px-4 text-base font-medium transition-colors"
              >
                <Send className="mr-2 h-4 w-4" />
                {t("contact.send")}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
