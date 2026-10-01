import { latinVariants, levenshteinRatio, stripLegal } from "@/lib/normalize";
import type { Company } from "@/lib/types";

const STOP = new Set(["al", "the", "and", "of", "for", "co", "company"]);

export type MatchKind = "exact" | "prefix" | "fuzzy" | "alias";

export type Scored = {
  company: Company;
  score: number;
  kind: MatchKind;
};

type Item = { company: Company; norm: string; tokens: string[] };

export type Catalog = {
  items: Item[];
  byNorm: Map<string, number[]>;
  byToken: Map<string, number[]>;
  tokensByLetter: Map<string, string[]>;
};

function tokensOf(norm: string): string[] {
  return norm.split(" ").filter((t) => t.length >= 2 && !STOP.has(t));
}

export function buildCatalog(companies: Company[]): Catalog {
  const items: Item[] = [];
  const byNorm = new Map<string, number[]>();
  const byToken = new Map<string, number[]>();
  const seen = new Set<string>();
  const tokensByLetter = new Map<string, string[]>();

  for (const company of companies) {
    const norm = stripLegal(company.name);
    const tokens = tokensOf(norm);
    const idx = items.length;
    items.push({ company, norm, tokens });
    const same = byNorm.get(norm);
    if (same) same.push(idx);
    else byNorm.set(norm, [idx]);
    for (const token of new Set(tokens)) {
      const ids = byToken.get(token);
      if (ids) ids.push(idx);
      else byToken.set(token, [idx]);
      if (!seen.has(token)) {
        seen.add(token);
        const bucket = tokensByLetter.get(token[0]);
        if (bucket) bucket.push(token);
        else tokensByLetter.set(token[0], [token]);
      }
    }
  }
  return { items, byNorm, byToken, tokensByLetter };
}

function fuzzyTokens(catalog: Catalog, qt: string): { token: string; ratio: number }[] {
  if (qt.length < 4) return [];
  const bucket = catalog.tokensByLetter.get(qt[0]) ?? [];
  const out: { token: string; ratio: number }[] = [];
  for (const token of bucket) {
    if (token === qt) continue;
    if (Math.abs(token.length - qt.length) > 2) continue;
    const ratio = levenshteinRatio(qt, token);
    if (ratio > 0 && ratio <= 0.34) out.push({ token, ratio });
  }
  out.sort((a, b) => a.ratio - b.ratio);
  return out.slice(0, 6);
}

type Hit = { score: number; kind: MatchKind };

function searchVariant(
  catalog: Catalog,
  variant: string,
  arabic: boolean,
  best: Map<number, Hit>,
  phase: "cheap" | "fuzzy",
) {
  const consider = (idx: number, score: number, kind: MatchKind) => {
    const prev = best.get(idx);
    if (!prev || score < prev.score) best.set(idx, { score, kind });
  };
  const kindAlias: MatchKind = arabic ? "alias" : "prefix";
  const significant = variant.split(" ").filter((t) => t.length >= 3 && !STOP.has(t));

  if (phase === "cheap") {
    for (let idx = 0; idx < catalog.items.length; idx++) {
      const norm = catalog.items[idx].norm;
      if (norm === variant) consider(idx, 0, arabic ? "alias" : "exact");
      else if (variant.length >= 2 && norm.startsWith(variant)) consider(idx, 0.07, "prefix");
      else if (variant.length >= 5 && norm.includes(variant)) consider(idx, 0.16, "prefix");
    }
    for (const qt of significant) {
      const direct = catalog.byToken.get(qt);
      if (direct) for (const idx of direct) consider(idx, 0.1, kindAlias);
      if (qt.length < 3) continue;
      for (const token of catalog.tokensByLetter.get(qt[0]) ?? []) {
        if (token.length >= qt.length && token.startsWith(qt) && token !== qt) {
          const ids = catalog.byToken.get(token);
          if (ids) for (const idx of ids) consider(idx, 0.17, "prefix");
        }
      }
    }
  } else {
    for (const qt of significant) {
      if (qt.length < 4) continue;
      for (const hit of fuzzyTokens(catalog, qt)) {
        const ids = catalog.byToken.get(hit.token);
        if (!ids) continue;
        for (const idx of ids) consider(idx, 0.2 + hit.ratio * 0.4, "fuzzy");
      }
    }
  }

  if (phase === "cheap" && significant.length >= 2 && best.size <= 400) {
    for (const [idx, hit] of best) {
      const tokens = catalog.items[idx].tokens;
      const all = significant.every((qt) =>
        tokens.some(
          (t) =>
            t === qt || t.startsWith(qt) || (qt.length >= 4 && levenshteinRatio(qt, t) <= 0.34),
        ),
      );
      if (all) hit.score = Math.min(hit.score, 0.04);
    }
  }
}

export function searchCatalog(catalog: Catalog, query: string, limit = 8): Scored[] {
  const variants = latinVariants(query);
  if (!variants.length) return [];
  const arabic = /[\u0600-\u06FF]/.test(query);
  const best = new Map<number, Hit>();
  for (const variant of variants) searchVariant(catalog, variant, arabic, best, "cheap");
  const strong = [...best.values()].filter((h) => h.score <= 0.12).length;
  if (strong < 5) {
    for (const variant of variants) searchVariant(catalog, variant, arabic, best, "fuzzy");
  }
  return [...best.entries()]
    .map(([idx, hit]) => ({
      company: catalog.items[idx].company,
      score: hit.score,
      kind: hit.kind,
    }))
    .sort((a, b) => a.score - b.score || a.company.name.localeCompare(b.company.name))
    .slice(0, limit);
}

export function findDuplicates(catalog: Catalog, nameEn: string, nameAr: string): Scored[] {
  const queries = [...new Set([...latinVariants(nameEn), ...latinVariants(nameAr)])].filter(
    (q) => q.length >= 3,
  );
  const best = new Map<number, number>();
  for (const q of queries) {
    const seeds = new Set<number>();
    for (const idx of catalog.byNorm.get(q) ?? []) seeds.add(idx);
    const parts = q.split(" ").filter((t) => t.length >= 3 && !STOP.has(t));
    const keys = parts.filter((t) => t.length >= 4);
    for (const t of keys.length ? keys : parts) {
      for (const idx of catalog.byToken.get(t) ?? []) seeds.add(idx);
      for (const hit of fuzzyTokens(catalog, t)) {
        for (const idx of catalog.byToken.get(hit.token) ?? []) seeds.add(idx);
      }
    }
    const qTokens = parts;
    for (const idx of seeds) {
      const item = catalog.items[idx];
      let score = levenshteinRatio(q, item.norm);
      if (qTokens.length) {
        let inter = 0;
        for (const t of qTokens) {
          if (item.tokens.includes(t)) inter += 1;
          else if (item.tokens.some((u) => u[0] === t[0] && levenshteinRatio(t, u) <= 0.34))
            inter += 0.75;
        }
        const union = qTokens.length + item.tokens.length - inter;
        if (union > 0) score = Math.min(score, 1 - inter / union);
      }
      if (q.length >= 8 && (item.norm.includes(q) || q.includes(item.norm))) {
        score = Math.min(score, 0.2);
      }
      if (score <= 0.42) {
        const prev = best.get(idx);
        if (prev === undefined || score < prev) best.set(idx, score);
      }
    }
  }
  return [...best.entries()]
    .map(([idx, score]) => ({
      company: catalog.items[idx].company,
      score,
      kind: (score === 0 ? "exact" : "fuzzy") as MatchKind,
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);
}

export function isHardDuplicate(score: number): boolean {
  return score <= 0.12;
}
