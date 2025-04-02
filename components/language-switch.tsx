"use client"

import { useState } from "react"
import { Globe } from "lucide-react"
import { useLanguage } from "@/context/language-context"

export function LanguageSwitch() {
  const [isOpen, setIsOpen] = useState(false)
  const { language, setLanguage } = useLanguage()

  const toggleDropdown = () => setIsOpen(!isOpen)

  const switchLanguage = (lang: "en" | "pt-BR") => {
    setLanguage(lang)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 w-10 h-10 transition-colors"
        aria-label="Switch language"
      >
        <Globe className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 rounded-lg bg-white dark:bg-neutral-800 shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden z-50">
          <button
            onClick={() => switchLanguage("en")}
            className={`w-full text-left px-4 py-2 text-sm ${
              language === "en"
                ? "bg-neutral-100 dark:bg-neutral-700 font-medium"
                : "hover:bg-neutral-50 dark:hover:bg-neutral-700"
            }`}
          >
            English
          </button>
          <button
            onClick={() => switchLanguage("pt-BR")}
            className={`w-full text-left px-4 py-2 text-sm ${
              language === "pt-BR"
                ? "bg-neutral-100 dark:bg-neutral-700 font-medium"
                : "hover:bg-neutral-50 dark:hover:bg-neutral-700"
            }`}
          >
            Português
          </button>
        </div>
      )}
    </div>
  )
}

