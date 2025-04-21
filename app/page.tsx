"use client";

import { Hero } from "@/components/hero";
import { About } from "@/components/about";
import { Experience } from "@/components/experience";
import { Technologies } from "@/components/technologies";
import { Education } from "@/components/education";
import { GitHubProjects } from "@/components/github-projects";
import { GitHubContributions } from "@/components/github-contributions";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      <Experience />
      <Technologies />
      <GitHubProjects />
      <GitHubContributions />
      <Education />
      <Contact />
      <Footer />
    </main>
  );
}
