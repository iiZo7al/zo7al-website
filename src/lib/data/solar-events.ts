export interface SolarEventsApplicationInput {
  name: string;
  age: string;
  discord: string;
  signedContractUrl: string;
  pledgeAgreed: boolean;
}

function cleanText(val: unknown, max: number): string {
  return typeof val === "string" ? val.trim().slice(0, max) : "";
}

export function validateSolarEventsApplication(
  body: unknown,
): SolarEventsApplicationInput | null {
  if (!body || typeof body !== "object") return null;
  const r = body as Record<string, unknown>;

  const name = cleanText(r.name, 80);
  const age = cleanText(r.age, 20);
  const discord = cleanText(r.discord, 60);
  const signedContractUrl = cleanText(r.signedContractUrl, 400);
  const pledgeAgreed = r.pledgeAgreed === true;

  if (!name || !age || !discord) return null;
  if (!pledgeAgreed) return null;
  if (!signedContractUrl.startsWith("/api/solar/media/")) return null;

  return {
    name,
    age,
    discord,
    signedContractUrl,
    pledgeAgreed: true,
  };
}
