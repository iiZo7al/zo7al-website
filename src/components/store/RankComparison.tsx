"use client";
import type { ReactNode } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import DetailsDialog from "@/components/ui/DetailsDialog";
import { isMonthlyRank } from "@/lib/data/store-booster";
import { storeExperienceCopy } from "@/lib/data/store-experience-copy";
import type { StoreProduct } from "@/lib/server/tebex";

export default function RankComparison({ products, price, describe, onClose }: { products: StoreProduct[]; price: (product: StoreProduct) => ReactNode; describe: (product: StoreProduct) => string[]; onClose: () => void }) {
  const t = useTranslations("store");
  const copy = storeExperienceCopy(useLocale());
  return <DetailsDialog title={copy.compare} onClose={onClose} style={{ width: "min(1040px, calc(100vw - 24px))" }}>
    <div className="store-comparison">
      <table>
        <caption className="sr-only">{copy.compare}</caption>
        <thead><tr><th scope="col">{t("ranksTitle")}</th><th scope="col">{copy.price}</th><th scope="col">{copy.billing}</th><th scope="col">{copy.benefits}</th></tr></thead>
        <tbody>{products.map(product => {
          const benefits = describe(product).filter(line => line.startsWith("• ")).map(line => line.slice(2));
          const billing = isMonthlyRank(product) ? t("monthly") : /permanent|دائم/i.test(product.description) ? copy.permanent : copy.terms;
          return <tr key={product.id}>
            <th scope="row">{product.image && <Image unoptimized src={product.image} alt="" width={104} height={72}/>}<bdi dir="ltr">{product.name}</bdi></th>
            <td data-label={copy.price}>{price(product)}</td>
            <td data-label={copy.billing}>{billing}</td>
            <td data-label={copy.benefits}>{benefits.length ? <ul>{benefits.map((benefit,index) => <li dir="auto" key={index}>{benefit}</li>)}</ul> : t("descriptionUnavailable")}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>
  </DetailsDialog>;
}
