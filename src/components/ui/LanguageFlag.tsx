import Image from "next/image";
const flags: Record<string, string> = { en: "gb", ar: "sa", es: "es", fr: "fr", de: "de", pt: "br", tr: "tr", ja: "jp", ko: "kr", zh: "cn" };
export default function LanguageFlag({ locale }: { locale: string }) { return <Image src={`/assets/flags/${flags[locale] ?? "gb"}.svg`} alt="" aria-hidden="true" width={22} height={16} className="h-4 w-[22px] shrink-0 rounded-[2px] object-cover" />; }
