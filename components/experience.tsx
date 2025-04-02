"use client"

import { useLanguage } from "@/context/language-context"

export function Experience() {
  const { t } = useLanguage()

  return (
    <section id="experience" className="py-24 px-4 md:px-6 bg-neutral-50 dark:bg-neutral-900">
      <div className="container mx-auto max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12 text-center">{t("experience.title")}</h2>
        <div className="space-y-16">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h3 className="text-2xl font-semibold">{t("experience.embrapa.title")}</h3>
                <p className="text-neutral-500 dark:text-neutral-400">{t("experience.embrapa.company")}</p>
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                {t("experience.embrapa.period")}
              </div>
            </div>
            <p className="text-neutral-600 dark:text-neutral-300">{t("experience.embrapa.description")}</p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h3 className="text-2xl font-semibold">{t("experience.ifms.title")}</h3>
                <p className="text-neutral-500 dark:text-neutral-400">{t("experience.ifms.company")}</p>
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                {t("experience.ifms.period")}
              </div>
            </div>
            <p className="text-neutral-600 dark:text-neutral-300">{t("experience.ifms.description")}</p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h3 className="text-2xl font-semibold">{t("experience.educacao.title")}</h3>
                <p className="text-neutral-500 dark:text-neutral-400">{t("experience.educacao.company")}</p>
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                {t("experience.educacao.period")}
              </div>
            </div>
            <p className="text-neutral-600 dark:text-neutral-300">{t("experience.educacao.description")}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

