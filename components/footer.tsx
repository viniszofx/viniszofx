"use client"

import Link from "next/link"
import { useLanguage } from "@/context/language-context"

export function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="py-12 px-4 md:px-6 border-t border-neutral-200 dark:border-neutral-800">
      <div className="container mx-auto max-w-3xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t("footer.copyright")}</p>
          <div className="flex items-center gap-8">
            <Link
              href="https://github.com/viniszofx"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
            >
              GitHub
            </Link>
            <Link
              href="https://twitter.com/viniszofx"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
            >
              Twitter
            </Link>
            <Link
              href="https://linkedin.com/in/viniszofx"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
            >
              LinkedIn
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

