import {getTranslations} from "next-intl/server";
import type { Metadata } from "next";
import { HomeUpdates } from "@/components/hub/ContentFeed";
import Hero from "@/components/home/Hero";
import UniverseShowcase from "@/components/home/UniverseShowcase";
import FaqSection from "@/components/faq/FaqSection";

export async function generateMetadata():Promise<Metadata>{const t=await getTranslations('metadata');return {title:{absolute:t('homeTitle')},description:t('homeDescription')};}

export default function HomePage() {
  return (
    <main data-accent="home">
      <Hero />
      <UniverseShowcase />
      <HomeUpdates />
      <FaqSection />
    </main>
  );
}
