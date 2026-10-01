import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { normalizeArabic, stripLegal } from "@/lib/normalize";
import type { Submission } from "@/lib/types";

type SubmitResult =
  | { ok: true; id: string; status: "pending" }
  | { ok: false; error: string };

type DecideResult = { ok: true; status: "active" | "rejected" } | { ok: false; error: string };

function asBanks(value: unknown): Array<"EIB" | "DIB"> {
  if (!Array.isArray(value)) return [];
  return value.filter((b): b is "EIB" | "DIB" => b === "EIB" || b === "DIB");
}

function text(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

export const listActive = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  return sql<Pick<Submission, "id" | "name_en" | "name_ar" | "banks" | "notes">>`
    select id, name_en, name_ar, banks, notes
    from company_submissions
    where status = 'active'
    order by created_at desc
    limit 200
  `;
});

export const listQueue = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  return sql<Submission>`
    select id, name_en, name_ar, banks, notes, status, decision_note,
           to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
    from company_submissions
    order by case when status = 'pending' then 0 else 1 end, created_at desc
    limit 100
  `;
});

export const submitCompany = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const src = (input ?? {}) as Record<string, unknown>;
    const nameAr = text(src.nameAr, 200);
    const nameEn = text(src.nameEn, 200);
    const banks = asBanks(src.banks);
    const notes = text(src.notes, 500);
    const overrideReason = text(src.overrideReason, 300);
    if (normalizeArabic(nameAr).length < 2 && stripLegal(nameEn).length < 2) {
      throw new Error("Enter an Arabic or English name");
    }
    if (!banks.length) throw new Error("Select at least one bank");
    return { nameAr, nameEn, banks, notes, overrideReason };
  })
  .handler(async ({ data }): Promise<SubmitResult> => {
    const sql = await getSql();
    const normEn = stripLegal(data.nameEn);
    const normAr = normalizeArabic(data.nameAr);
    const dupes = await sql<{ id: string }>`
      select id from company_submissions
      where status in ('pending', 'active')
        and (
          (${normEn} <> '' and norm_en = ${normEn})
          or (${normAr} <> '' and norm_ar = ${normAr})
        )
      limit 3
    `;
    if (dupes.length && data.overrideReason.length < 15) {
      return {
        ok: false,
        error: "A similar company is already submitted or approved. Explain in 15+ characters to send it anyway.",
      };
    }
    const id = crypto.randomUUID();
    const notes = data.overrideReason
      ? `${data.notes}${data.notes ? "\n" : ""}Similar name noted: ${data.overrideReason}`.slice(0, 800)
      : data.notes;
    await sql`
      insert into company_submissions (id, name_ar, name_en, norm_en, norm_ar, banks, notes)
      values (${id}, ${data.nameAr}, ${data.nameEn}, ${normEn}, ${normAr}, ${data.banks.join(",")}, ${notes})
    `;
    await sql`
      insert into company_audit (action, submission_id, detail)
      values ('add_request', ${id}, ${notes.slice(0, 300)})
    `;
    return { ok: true, id, status: "pending" };
  });

export const decideSubmission = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const src = (input ?? {}) as Record<string, unknown>;
    const id = text(src.id, 80);
    const action = src.action === "approve" || src.action === "reject" ? src.action : "";
    const reason = text(src.reason, 400);
    if (!id || !action) throw new Error("Missing decision");
    if (action === "reject" && reason.length < 3) throw new Error("A reject reason is required");
    return { id, action, reason };
  })
  .handler(async ({ data }): Promise<DecideResult> => {
    const sql = await getSql();
    const status = data.action === "approve" ? "active" : "rejected";
    const rows = await sql<{ id: string }>`
      update company_submissions
      set status = ${status},
          decision_note = ${data.reason},
          decided_at = now()
      where id = ${data.id} and status = 'pending'
      returning id
    `;
    if (!rows.length) return { ok: false, error: "That request is no longer pending" };
    await sql`
      insert into company_audit (action, submission_id, detail)
      values (${data.action}, ${data.id}, ${data.reason})
    `;
    return { ok: true, status };
  });

export const flagCompany = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const src = (input ?? {}) as Record<string, unknown>;
    const companyId = text(src.companyId, 80);
    const note = text(src.note, 300);
    if (!companyId || note.length < 3) throw new Error("Add a short note");
    return { companyId, note };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`
      insert into company_audit (action, submission_id, detail)
      values ('flag', ${data.companyId}, ${data.note})
    `;
    return { ok: true as const };
  });
