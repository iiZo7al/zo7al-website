export const STORE_URL = "https://zo7al.tebex.io/";

export type StoreRank = {
  id: string;
  name: string;
  price: string;
  url: string;
  perks: string[];
  featured?: boolean;
};

// Verified against the live Tebex storefront — prices and perks only,
// nothing invented.
export const STORE_RANKS: StoreRank[] = [
  {
    id: "vip",
    name: "VIP",
    price: "$9.99",
    url: "https://zo7al.tebex.io/package/7312779",
    perks: [
      "Exclusive in-game tag",
      "Special chat color",
      "/kit VIP",
      "Extra small permissions",
      "Faster in-game support",
    ],
  },
  {
    id: "mvp",
    name: "MVP",
    price: "$19.99",
    url: "https://zo7al.tebex.io/package/7312781",
    perks: [
      "Includes all VIP perks",
      "Stronger /kit MVP",
      "More homes (/sethome)",
      "Extra special permissions",
      "Survival advantages",
    ],
  },
  {
    id: "mvp-plus",
    name: "MVP+",
    price: "$29.99",
    url: "https://zo7al.tebex.io/package/7312784",
    featured: true,
    perks: [
      "Includes all MVP perks",
      "Legendary /kit MVP+",
      "Exclusive features",
      "Server join priority",
      "Advanced permissions",
    ],
  },
];
