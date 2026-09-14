import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import UniverseShowcase from "@/components/home/UniverseShowcase";
import AboutSection from "@/components/home/AboutSection";
import FaqSection from "@/components/faq/FaqSection";

export const metadata: Metadata = {
  title: "ZO7AL Projects — Gaming Universe",
  description:
    "Minecraft servers, Fortnite maps, modpacks and gaming projects by Zo7al.",
};

export default function HomePage() {
  return (
    <main data-accent="home">
      <Hero />
      <UniverseShowcase />
      <AboutSection />
      <FaqSection />
    </main>
  );
}
