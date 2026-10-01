import type { Company } from "@/lib/types";

let cache: Promise<Company[]> | null = null;

export function loadCompanies(): Promise<Company[]> {
  cache ??= fetch("/companies.json")
    .then((res) => {
      if (!res.ok) throw new Error("Could not load the company list");
      return res.json() as Promise<Company[]>;
    })
    .catch((err: unknown) => {
      cache = null;
      throw err;
    });
  return cache;
}
