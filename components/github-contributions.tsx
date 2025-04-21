"use client";

import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { useLanguage } from "@/context/language-context";

export function GitHubContributions() {
  const { t } = useLanguage();
  const [contributions, setContributions] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contributionLevels, setContributionLevels] = useState<number[][]>([]);

  useEffect(() => {
    // Generate contribution levels once on mount
    const levels = Array(52)
      .fill(null)
      .map(() =>
        Array(7)
          .fill(null)
          .map(() => Math.floor(Math.random() * 5))
      );
    setContributionLevels(levels);

    // Simulate contribution fetch
    const simulateContributionFetch = () => {
      setTimeout(() => {
        setContributions(247);
        setIsLoading(false);
      }, 1000);
    };

    simulateContributionFetch();
  }, []);

  const getBackgroundColor = (level: number) => {
    if (level === 0) return "bg-neutral-100 dark:bg-neutral-700";
    if (level === 1) return "bg-green-100 dark:bg-green-900/30";
    if (level === 2) return "bg-green-200 dark:bg-green-800/40";
    if (level === 3) return "bg-green-300 dark:bg-green-700/50";
    return "bg-green-400 dark:bg-green-600/60";
  };

  return (
    <section className="py-24 px-4 md:px-6">
      <div className="container mx-auto max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12 text-center">
          {t("github.title")}
        </h2>

        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <Calendar className="h-12 w-12 text-neutral-400" />

            {isLoading ? (
              <div className="h-16 w-32 bg-neutral-100 dark:bg-neutral-700 rounded animate-pulse" />
            ) : (
              <>
                <h3 className="text-4xl font-bold">{contributions}</h3>
                <p className="text-neutral-500 dark:text-neutral-400 text-center">
                  {t("github.contributions")}
                </p>
              </>
            )}

            <div className="mt-6 w-full max-w-md">
              <div className="grid grid-cols-12 gap-1">
                {contributionLevels.map((week, weekIndex) => (
                  <div
                    key={`week-${weekIndex}`}
                    className="flex flex-col gap-1"
                  >
                    {week.map((level, dayIndex) => (
                      <div
                        key={`day-${weekIndex}-${dayIndex}`}
                        className={`w-2 h-2 rounded-sm ${getBackgroundColor(
                          level
                        )}`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
