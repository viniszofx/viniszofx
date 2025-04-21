"use client";

import { GraduationCap, Award } from "lucide-react";
import { useLanguage } from "@/context/language-context";

export function Education() {
  const { t } = useLanguage();

  return (
    <section
      id="education"
      className="py-24 px-4 md:px-6 bg-neutral-50 dark:bg-neutral-900"
    >
      <div className="container mx-auto max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12 text-center">
          {t("education.title")}
        </h2>
        <div className="space-y-16">
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <GraduationCap className="h-10 w-10 text-neutral-400" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold">
                {t("education.degree.title")}
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 mb-2">
                {t("education.degree.institution")}
              </p>
              <p className="text-neutral-600 dark:text-neutral-300">
                {t("education.degree.period")}
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <Award className="h-10 w-10 text-neutral-400" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold">
                {t("education.certificate.title")}
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 mb-2">
                {t("education.certificate.institution")}
              </p>
              <p className="text-neutral-600 dark:text-neutral-300">
                {t("education.certificate.period")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <h3 className="text-2xl font-semibold mb-6">
            {t("education.languages.title")}
          </h3>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="font-medium">
                {t("education.languages.portuguese")}
              </p>
              <p className="text-neutral-500 dark:text-neutral-400">
                {t("education.languages.portuguese.level")}
              </p>
            </div>
            <div>
              <p className="font-medium">{t("education.languages.english")}</p>
              <p className="text-neutral-500 dark:text-neutral-400">
                {t("education.languages.english.level")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
