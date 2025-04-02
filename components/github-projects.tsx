"use client"

import { useEffect, useState } from "react"
import { ExternalLink, Github, Star } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/context/language-context"

type Repository = {
  name: string
  description: string | null
  html_url: string
  stargazers_count: number
  language: string | null
  fork: boolean
}

export function GitHubProjects() {
  const { t } = useLanguage()
  const [repos, setRepos] = useState<Repository[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchRepos() {
      try {
        const response = await fetch("https://api.github.com/users/viniszofx/repos")
        if (!response.ok) throw new Error("Failed to fetch repositories")
        const data = await response.json()

        // Filter out forked repositories and sort by stars
        const filteredRepos = data
          .filter((repo: Repository) => !repo.fork)
          .sort((a: Repository, b: Repository) => b.stargazers_count - a.stargazers_count)
          .slice(0, 6) // Get top 6 repos

        setRepos(filteredRepos)
      } catch (error) {
        console.error("Error fetching GitHub repositories:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRepos()
  }, [])

  return (
    <section id="projects" className="py-24 px-4 md:px-6 bg-neutral-50 dark:bg-neutral-900">
      <div className="container mx-auto max-w-3xl">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t("projects.title")}</h2>
          <Link
            href="https://github.com/viniszofx"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
          >
            <Github className="h-4 w-4" />
            {t("projects.viewGithub")}
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-6 h-48 animate-pulse" />
            ))}
          </div>
        ) : repos.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {repos.map((repo) => (
              <Link
                key={repo.name}
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 hover:shadow-md dark:hover:border-neutral-600 transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                    {repo.name}
                  </h3>
                  <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
                    <Star className="h-4 w-4" />
                    <span className="text-xs">{repo.stargazers_count}</span>
                  </div>
                </div>
                {repo.description && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4 line-clamp-2">{repo.description}</p>
                )}
                <div className="flex justify-between items-center mt-auto">
                  {repo.language && (
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">{repo.language}</span>
                  )}
                  <ExternalLink className="h-4 w-4 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-neutral-500 dark:text-neutral-400">{t("projects.noRepos")}</p>
        )}
      </div>
    </section>
  )
}

