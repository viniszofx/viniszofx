"use client"

import { useLanguage } from "@/context/language-context"

export function About() {
  const { t } = useLanguage()

  return (
    <section id="about" className="py-24 px-4 md:px-6">
      <div className="container mx-auto max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12 text-center">{t("about.title")}</h2>
        <div className="space-y-6 text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed">
          <p>{t("about.p1")}</p>
          <p>{t("about.p2")}</p>
          <p>{t("about.p3")}</p>
          <p>{t("about.p4")}</p>
        </div>
      </div>
    </section>
  )
}

