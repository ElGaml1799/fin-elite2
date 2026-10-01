import { Link } from "@tanstack/react-router";
import { AlertTriangle, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { loadCompanies } from "@/lib/catalog";
import { findDuplicates, isHardDuplicate, searchCatalog, buildCatalog, type Catalog } from "@/lib/search";
import { flagCompany, listActive, listQueue, submitCompany } from "@/lib/submissions";
import type { Bank, Company, Risk } from "@/lib/types";

const KIND: Record<string, string> = {
  exact: "Exact",
  prefix: "Name",
  fuzzy: "Spelling",
  alias: "Arabic",
};

function banksOf(value: string): Bank[] {
  return value
    .split(",")
    .map((b) => b.trim())
    .filter((b): b is Bank => b === "EIB" || b === "DIB");
}

function BankChip({ bank }: { bank: Bank }) {
  const dubai = bank === "DIB";
  return (
    <span
      className={
        dubai
          ? "inline-flex items-center rounded-full bg-dib px-2.5 py-1 text-xs font-medium text-dib-fg"
          : "inline-flex items-center rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-fg"
      }
    >
      {dubai ? "Dubai Islamic" : "Emirates Islamic"}
    </span>
  );
}

function RiskChip({ risk }: { risk: Risk }) {
  if (risk === "clear") return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-hold-bg px-2.5 py-1 text-xs font-medium text-hold">
      <AlertTriangle className="size-3.5" aria-hidden="true" />
      {risk === "hold" ? "Hold" : "Restricted"}
    </span>
  );
}

function cats(company: Company): string {
  const parts = [];
  if (company.eibCat) parts.push(`EIB ${company.eibCat}`);
  if (company.dibCat) parts.push(`DIB ${company.dibCat}`);
  return parts.join(" · ");
}

export function Lookup() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [base, setBase] = useState<Company[] | null>(null);
  const [added, setAdded] = useState<Company[]>([]);
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [banner, setBanner] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let live = true;
    loadCompanies()
      .then((rows) => {
        if (live) setBase(rows);
      })
      .catch(() => {
        if (live) setLoadError("The company list did not load. Refresh and try again.");
      });
    const pullAdded = () => {
      listActive()
        .then((rows) => {
          if (!live) return;
          setAdded(
            rows.map((row) => ({
              id: `add-${row.id}`,
              name: row.name_en || row.name_ar,
              banks: banksOf(row.banks),
              risk: "clear" as const,
              remark: row.notes || undefined,
              added: true,
              ...(row.name_ar ? { group: row.name_ar } : {}),
            })),
          );
        })
        .catch(() => {
          /* search still works without approved additions */
        });
      listQueue()
        .then((rows) => {
          if (live) setPendingCount(rows.filter((row) => row.status === "pending").length);
        })
        .catch(() => undefined);
    };
    pullAdded();
    window.addEventListener("focus", pullAdded);
    return () => {
      live = false;
      window.removeEventListener("focus", pullAdded);
    };
  }, []);

  const catalog = useMemo<Catalog | null>(
    () => (base ? buildCatalog([...base, ...added]) : null),
    [base, added],
  );

  const results = useMemo(
    () => (catalog && debounced.length >= 2 ? searchCatalog(catalog, debounced, 8) : []),
    [catalog, debounced],
  );

  const selected = results.find((hit) => hit.company.id === selectedId)?.company ?? null;
  const holds = base?.filter((row) => row.risk === "hold").length ?? 0;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="h-1 bg-primary" />
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-28">
        <header className="sticky top-0 z-10 -mx-4 border-b border-border bg-bg/95 px-4 pt-4 pb-3 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium tracking-wide text-primary uppercase">Employer list</p>
              <h1 className="mt-1 text-2xl font-semibold text-fg">Company lookup</h1>
            </div>
            <Link
              to="/review"
              className="mt-1 inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium text-fg"
            >
              Review
              {pendingCount > 0 ? (
                <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-fg tabular-nums">
                  {pendingCount}
                </span>
              ) : null}
            </Link>
          </div>
          <p className="mt-1 text-sm text-muted" dir="auto">
            اكتب اسم الشركة بالعربية أو الإنجليزية — النتائج تظهر أثناء الكتابة
          </p>
          <label className="mt-3 block">
            <span className="sr-only">Company name</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted" />
              <input
                value={query}
                dir="auto"
                autoFocus
                autoComplete="off"
                placeholder="Company name"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSelectedId(null);
                }}
                className="min-h-12 w-full rounded-md border border-border bg-surface pr-11 pl-11 text-base text-fg placeholder:text-muted"
              />
              {query ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("");
                    setSelectedId(null);
                  }}
                  className="absolute top-1/2 right-2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </span>
          </label>
          <p className="mt-2 text-xs text-muted tabular-nums">
            {base
              ? `${base.length.toLocaleString()} listed · ${holds.toLocaleString()} on hold`
              : loadError
                ? loadError
                : "Loading listed companies…"}
          </p>
        </header>

        {banner ? (
          <p className="mt-4 rounded-md border border-border bg-surface px-3 py-3 text-sm text-fg">{banner}</p>
        ) : null}

        <main className="mt-3 flex-1">
          {debounced.length >= 2 && catalog && results.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface px-4 py-6">
              <p className="font-medium text-fg">No listed company</p>
              <p className="mt-1 text-sm text-muted">Check the spelling, or send this name for review.</p>
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-fg"
              >
                <Plus className="size-4" />
                Add company
              </button>
            </div>
          ) : null}

          {results.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {results.map((hit) => {
                const open = selectedId === hit.company.id;
                return (
                  <li key={hit.company.id}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setSelectedId(open ? null : hit.company.id)}
                      className="w-full rounded-lg border border-border bg-surface px-3 py-3 text-left"
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="font-medium text-fg" dir="auto">
                          {hit.company.name}
                        </span>
                        <span className="shrink-0 text-xs text-muted">{KIND[hit.kind]}</span>
                      </span>
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        {hit.company.banks.map((bank) => (
                          <BankChip key={bank} bank={bank} />
                        ))}
                        <RiskChip risk={hit.company.risk} />
                        {hit.company.added ? (
                          <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-xs text-muted">
                            Added
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-2 block text-sm text-muted">
                        {[hit.company.group, hit.company.emirate, cats(hit.company)]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </button>
                    {open && selected ? <Detail company={selected} /> : null}
                  </li>
                );
              })}
            </ul>
          ) : null}

          {debounced.length < 2 && base ? (
            <p className="mt-6 text-sm text-muted">
              Type at least two letters. Misspellings and Arabic names such as الفطيم or أدنوك are matched to the
              English legal name.
            </p>
          ) : null}
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-primary text-base font-medium text-primary-fg"
          >
            <Plus className="size-5" />
            Add company
          </button>
        </div>
      </div>

      {addOpen && catalog ? (
        <AddSheet
          initialQuery={query}
          catalog={catalog}
          onClose={() => setAddOpen(false)}
          onDone={() => {
            setAddOpen(false);
            setBanner("Sent for review. It appears in search only after someone approves it.");
            listQueue()
              .then((rows) => setPendingCount(rows.filter((row) => row.status === "pending").length))
              .catch(() => undefined);
          }}
        />
      ) : null}
    </div>
  );
}

function Detail({ company }: { company: Company }) {
  const [note, setNote] = useState("");
  const [state, setState] = useState("");

  return (
    <div className="mt-2 rounded-lg border border-border bg-bg px-3 py-3">
      {company.risk !== "clear" ? (
        <p className="rounded-md bg-hold-bg px-3 py-2 text-sm font-medium text-hold">
          {company.risk === "hold" ? "Hold on retail credit" : "Restriction on file"} — read the note before proceeding.
        </p>
      ) : (
        <p className="text-sm font-medium text-primary">Listed. You can proceed with the usual checks.</p>
      )}
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <Fact label="Category" value={cats(company)} />
        <Fact label="Group" value={company.group} />
        <Fact label="Emirate" value={company.emirate} />
        <Fact label="Industry" value={company.industry} />
        <Fact label="P.O. Box" value={company.po} />
        <Fact label="Employer ID" value={company.employerId} />
      </dl>
      {company.remark ? (
        <p className="mt-3 text-sm text-pretty text-fg" dir="auto">
          {company.remark}
        </p>
      ) : null}
      <form
        className="mt-3"
        onSubmit={(event) => {
          event.preventDefault();
          setState("Saving…");
          flagCompany({ data: { companyId: company.id, note } })
            .then(() => {
              setState("Noted for the reviewer.");
              setNote("");
            })
            .catch(() => setState("Could not save the note."));
        }}
      >
        <label className="block text-xs font-medium text-muted" htmlFor={`flag-${company.id}`}>
          Flag a problem with this record
        </label>
        <textarea
          id={`flag-${company.id}`}
          value={note}
          dir="auto"
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          maxLength={300}
          className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
        />
        <button
          type="submit"
          disabled={note.trim().length < 3}
          className="mt-2 inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium text-fg disabled:opacity-50"
        >
          Save note
        </button>
        {state ? <p className="mt-2 text-xs text-muted">{state}</p> : null}
      </form>
    </div>
  );
}

function Fact({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-fg" dir="auto">
        {value}
      </dd>
    </div>
  );
}

function AddSheet({
  initialQuery,
  catalog,
  onClose,
  onDone,
}: {
  initialQuery: string;
  catalog: Catalog;
  onClose: () => void;
  onDone: () => void;
}) {
  const arabicQuery = /[\u0600-\u06FF]/.test(initialQuery);
  const [nameAr, setNameAr] = useState(arabicQuery ? initialQuery : "");
  const [nameEn, setNameEn] = useState(arabicQuery ? "" : initialQuery);
  const [banks, setBanks] = useState<Bank[]>(["EIB"]);
  const [notes, setNotes] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const dupes = useMemo(
    () => findDuplicates(catalog, nameEn, nameAr),
    [catalog, nameEn, nameAr],
  );
  const hard = dupes.some((hit) => isHardDuplicate(hit.score));
  const needsConfirm = dupes.length > 0;
  const nameOk = nameAr.trim().length >= 2 || nameEn.trim().length >= 2;

  function toggle(bank: Bank) {
    setBanks((current) =>
      current.includes(bank) ? current.filter((item) => item !== bank) : [...current, bank],
    );
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-fg/40">
      <button type="button" aria-label="Close" className="absolute inset-0" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-title"
        className="relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-lg border border-border bg-surface px-4 pt-4 pb-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="add-title" className="text-xl font-semibold text-fg">
              Add company
            </h2>
            <p className="mt-1 text-sm text-muted">It stays off the search list until a reviewer approves it.</p>
          </div>
          <button type="button" aria-label="Close add form" onClick={onClose} className="inline-flex size-11 items-center justify-center rounded-md">
            <X className="size-5" />
          </button>
        </div>

        <label className="mt-4 block text-sm font-medium text-fg" htmlFor="name-ar">
          Arabic name
        </label>
        <input
          id="name-ar"
          dir="auto"
          value={nameAr}
          onChange={(event) => {
            setNameAr(event.target.value);
            setConfirmed(false);
          }}
          className="mt-1 min-h-12 w-full rounded-md border border-border bg-bg px-3 text-base text-fg"
        />

        <label className="mt-3 block text-sm font-medium text-fg" htmlFor="name-en">
          English name
        </label>
        <input
          id="name-en"
          dir="auto"
          value={nameEn}
          onChange={(event) => {
            setNameEn(event.target.value);
            setConfirmed(false);
          }}
          className="mt-1 min-h-12 w-full rounded-md border border-border bg-bg px-3 text-base text-fg"
        />
        <p className="mt-1 text-xs text-muted">One of the two names is required.</p>

        <p className="mt-4 text-sm font-medium text-fg">Banks</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(["EIB", "DIB"] as const).map((bank) => {
            const on = banks.includes(bank);
            return (
              <button
                key={bank}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(bank)}
                className={
                  on
                    ? "min-h-12 rounded-md border border-primary bg-primary text-sm font-medium text-primary-fg"
                    : "min-h-12 rounded-md border border-border bg-bg text-sm font-medium text-fg"
                }
              >
                {bank === "EIB" ? "Emirates Islamic" : "Dubai Islamic"}
              </button>
            );
          })}
        </div>

        <label className="mt-4 block text-sm font-medium text-fg" htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          dir="auto"
          value={notes}
          maxLength={500}
          rows={3}
          onChange={(event) => setNotes(event.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg"
        />

        {dupes.length > 0 ? (
          <div className="mt-4 rounded-md border border-hold/40 bg-hold-bg px-3 py-3">
            <p className="text-sm font-medium text-hold">Possible duplicates</p>
            <ul className="mt-2 flex flex-col gap-2">
              {dupes.map((hit) => (
                <li key={hit.company.id} className="text-sm text-fg">
                  <span className="font-medium">{hit.company.name}</span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {hit.company.banks.map((bank) => (
                      <BankChip key={bank} bank={bank} />
                    ))}
                  </span>
                </li>
              ))}
            </ul>
            <label className="mt-3 flex min-h-11 items-start gap-2 text-sm text-fg">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="mt-1 size-4"
              />
              None of these is the same company
            </label>
            {hard ? (
              <>
                <label className="mt-2 block text-sm font-medium text-fg" htmlFor="override">
                  Why this is still a new company
                </label>
                <textarea
                  id="override"
                  value={overrideReason}
                  onChange={(event) => setOverrideReason(event.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
                />
                <p className="mt-1 text-xs text-muted">At least 15 characters. A very close name cannot go through quietly.</p>
              </>
            ) : null}
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm text-hold">{error}</p> : null}

        <button
          type="button"
          disabled={busy || !nameOk || banks.length === 0 || (needsConfirm && !confirmed) || (hard && overrideReason.trim().length < 15)}
          onClick={() => {
            setBusy(true);
            setError("");
            submitCompany({
              data: { nameAr, nameEn, banks, notes, overrideReason: hard ? overrideReason : "" },
            })
              .then((result) => {
                if (!result.ok) {
                  setError(result.error);
                  setBusy(false);
                  return;
                }
                onDone();
              })
              .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : "Could not submit");
                setBusy(false);
              });
          }}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-primary text-base font-medium text-primary-fg disabled:opacity-50"
        >
          {busy ? "Sending…" : "Submit for approval"}
        </button>
      </div>
    </div>
  );
}
