import type { Metadata } from "next";
import SolarClient from "@/components/solar/SolarClient";

export const metadata: Metadata = {
  title: "Solar System Team • كلان سولار — شبكة زحل Zo7al",
  description:
    "الصفحة الرسمية لكلان Solar System Team. انضم لصناع المحتوى واللاعبين التنافسيين والإداريين وتحدّ في ماب الكلان الرسمي.",
};

export default function SolarPage() {
  return (
    <main>
      <SolarClient />
    </main>
  );
}
