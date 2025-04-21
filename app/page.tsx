"use client";

import { About } from "@/components/about";
import { Contact } from "@/components/contact";
import { Education } from "@/components/education";
import { Experience } from "@/components/experience";
import { Footer } from "@/components/footer";
import { GitHubContributions } from "@/components/github-contributions";
import { GitHubProjects } from "@/components/github-projects";
import { Hero } from "@/components/hero";
import { Technologies } from "@/components/technologies";

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
