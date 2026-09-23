import { fortniteLocale } from "../sync/fortnite-parser";

export const FORTNITE_PROFILE_URL = "https://www.fortnite.com/@zo7al";
export const FORTNITE_CREATOR_CODE = "zo7al";

export type FortniteMap = {
  id: string;
  title: string;
  code: string;
  category: string;
  thumbnail: string;
  featured?: boolean;
  description?: string;
  tags?: string[];
  videoUrl?: string;
};

// Verified against the live creator page — island codes and artwork only,
// nothing invented.
export const FORTNITE_MAPS: FortniteMap[] = [
  {
    id: "saturn-sniper",
    title: "سنايبرات زحل Zo7al 💥🚀",
    code: "0633-4212-9611",
    category: "Sniper",
    thumbnail:
      "https://cdn-0001.qstv.on.epicgames.com/HjNqXNeKEYZUkWqqaa/image/landscape_comp_s.jpeg",
    featured: true,
  },
  {
    id: "solo-scrims-galaxy",
    title: "SOLO SCRIMS GALAXY سكرمز الجالكسي 🏆🚀",
    code: "3325-4001-0926",
    category: "Scrims",
    thumbnail:
      "https://cdn-0001.qstv.on.epicgames.com/MEyKNAJipybexZQSvJ/image/landscape_comp_s.jpeg",
    featured: true,
  },
  {
    id: "all-weapons",
    title: "ALL WEAPONS زحل Zo7al 🚀✨",
    code: "4904-5829-1966",
    category: "Fun",
    thumbnail:
      "https://cdn-0001.qstv.on.epicgames.com/qXudjUagJtWxpluyYZ/image/landscape_comp_s.jpeg",
    featured: true,
  },
  {
    id: "clan-wars",
    title: "حرب الكلانات زحل Zo7al 🚀💥",
    code: "6387-4453-1682",
    category: "Clan Wars",
    thumbnail:
      "https://cdn-0001.qstv.on.epicgames.com/KSyPkiECgPrJXxxbgG/image/landscape_comp_s.jpeg",
  },
  {
    id: "best-1v1",
    title: "Best 1v1 Map زحل Zo7al 🎵🚀",
    code: "2994-5126-9804",
    category: "Build Fight",
    thumbnail:
      "https://cdn-0001.qstv.on.epicgames.com/XEBguwzCVNPubSsjzM/image/landscape_comp_s.jpeg",
  },
  {
    id: "solo-scrims-delulu",
    title: "SOLO SCRIMS DELULU سكرمز ديلولو🏆🚀",
    code: "7067-2620-1606",
    category: "Scrims",
    thumbnail:
      "https://cdn-0001.qstv.on.epicgames.com/pvOLFEkZXGpzBOXrqz/image/landscape_comp_s.jpeg",
  },
  {
    id: "red-vs-blue",
    title: "🔴 أحمر مقابل أزرق 🔵 زحل Zo7al 🚀",
    code: "3310-5985-8629",
    category: "Red vs Blue",
    thumbnail:
      "https://cdn-0001.qstv.on.epicgames.com/foXbZSGcqOeoFnZMZo/image/landscape_comp_s.jpeg",
  },
  {
    id: "1v1v1-infinite",
    title: "1v1v1 Invinite زحل Zo7al ✅🚀",
    code: "4621-8547-5867",
    category: "1v1v1",
    thumbnail:
      "https://cdn-0001.qstv.on.epicgames.com/PoplnXNuHpcJIlKALN/image/landscape_comp_s.jpeg",
  },
  {
    id: "1v1v1-one-shot",
    title: "1v1v1 One Shot زحل Zo7al ✅🚀",
    code: "1888-6512-8811",
    category: "1v1v1",
    thumbnail:
      "https://cdn-0001.qstv.on.epicgames.com/KyXtvIDaaIfhMEurSv/image/landscape_comp_s.jpeg",
  },
  {
    id: "1v1v1-reload",
    title: "1v1v1 Reload زحل Zo7al ✅🚀",
    code: "6995-1684-7602",
    category: "1v1v1",
    thumbnail:
      "https://cdn-0001.qstv.on.epicgames.com/yUsUFBBbrMbyfNxtnq/image/landscape_comp_s.jpeg",
  },
  {
    id: "fight-me-build",
    title: "عاركني بالبناء زحل Zo7al💎🚀",
    code: "2404-2844-7787",
    category: "Build Fight",
    thumbnail:
      "https://cdn-0001.qstv.on.epicgames.com/emPFatMRpdjmHUIPot/image/landscape_comp_s.jpeg",
  },
];

export function islandCodeUrl(code: string, locale = "en") {
  return `https://www.fortnite.com/@zo7al/${code}?lang=${fortniteLocale(locale)}`;
}

