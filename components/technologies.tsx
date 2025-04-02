"use client"

import { Code, Database, FileText } from "lucide-react"
import { useLanguage } from "@/context/language-context"

export function Technologies() {
  const { t } = useLanguage()

  const technologies = [
    {
      category: t("technologies.languages"),
      icon: <Code className="h-6 w-6 text-neutral-400" />,
      items: ["TypeScript", "JavaScript", "Java", "Node.js", "React", "Tailwind CSS"],
    },
    {
      category: t("technologies.databases"),
      icon: <Database className="h-6 w-6 text-neutral-400" />,
      items: ["MySQL", "MongoDB"],
    },
    {
      category: t("technologies.tools"),
      icon: <FileText className="h-6 w-6 text-neutral-400" />,
      items: ["Word", "Excel", "PowerPoint"],
    },
  ]

  return (
    <section id="technologies" className="py-24 px-4 md:px-6">
      <div className="container mx-auto max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12 text-center">{t("technologies.title")}</h2>
        <div className="grid gap-12">
          {technologies.map((tech) => (
            <div key={tech.category} className="flex gap-6">
              <div className="flex-shrink-0 mt-1">{tech.icon}</div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-4">{tech.category}</h3>
                <div className="flex flex-wrap gap-2">
                  {tech.items.map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-full text-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

