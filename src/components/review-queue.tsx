import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { decideSubmission, listQueue } from "@/lib/submissions";
import type { Submission } from "@/lib/types";

function when(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "d MMM yyyy, HH:mm");
}

export function ReviewQueue() {
  const [rows, setRows] = useState<Submission[] | null>(null);
  const [error, setError] = useState("");
  const [reason, setReason] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");

  function reload() {
    return listQueue()
      .then(setRows)
      .catch(() => setError("The review queue did not load."));
  }

  useEffect(() => {
    let live = true;
    listQueue()
      .then((next) => {
        if (live) setRows(next);
      })
      .catch(() => {
        if (live) setError("The review queue did not load.");
      });
    return () => {
      live = false;
    };
  }, []);

  const pending = rows?.filter((row) => row.status === "pending") ?? [];
  const done = rows?.filter((row) => row.status !== "pending") ?? [];

  function decide(id: string, action: "approve" | "reject") {
    setBusy(id);
    setError("");
    decideSubmission({ data: { id, action, reason: reason[id] ?? "" } })
      .then((result) => {
        if (!result.ok) {
          setError(result.error);
          setBusy("");
          return;
        }
        return reload();
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not save"))
      .finally(() => setBusy(""));
  }

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="h-1 bg-primary" />
      <div className="mx-auto w-full max-w-2xl px-4 py-4">
        <Link to="/" className="inline-flex min-h-11 items-center text-sm font-medium text-primary">
          Back to search
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-fg">Review queue</h1>
        <p className="mt-1 text-sm text-muted">
          Approve a name to put it on the search list. Reject it to keep it off. This preview has no sign-in, so treat
          the queue as open to anyone with the link.
        </p>
        {error ? <p className="mt-3 text-sm text-hold">{error}</p> : null}
        {rows === null && !error ? <p className="mt-6 text-sm text-muted">Loading requests…</p> : null}

        <section className="mt-5">
          <h2 className="text-sm font-medium tracking-wide text-muted uppercase">Pending</h2>
          {rows && pending.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Nothing waiting.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-3">
              {pending.map((row) => (
                <li key={row.id} className="rounded-lg border border-border bg-surface px-3 py-3">
                  <p className="font-medium text-fg" dir="auto">
                    {row.name_en || row.name_ar}
                  </p>
                  {row.name_ar && row.name_en ? (
                    <p className="text-sm text-muted" dir="auto">
                      {row.name_ar}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-fg">{row.banks.replaceAll(",", " · ")}</p>
                  {row.notes ? (
                    <p className="mt-2 text-sm text-pretty text-muted" dir="auto">
                      {row.notes}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted tabular-nums">{when(row.created_at)}</p>
                  <label className="mt-3 block text-xs font-medium text-muted" htmlFor={`reason-${row.id}`}>
                    Note (required to reject)
                  </label>
                  <textarea
                    id={`reason-${row.id}`}
                    value={reason[row.id] ?? ""}
                    onChange={(event) => setReason((current) => ({ ...current, [row.id]: event.target.value }))}
                    rows={2}
                    className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg"
                  />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={busy === row.id}
                      onClick={() => decide(row.id, "approve")}
                      className="min-h-11 rounded-md bg-primary text-sm font-medium text-primary-fg disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busy === row.id || (reason[row.id] ?? "").trim().length < 3}
                      onClick={() => decide(row.id, "reject")}
                      className="min-h-11 rounded-md border border-border bg-bg text-sm font-medium text-fg disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {done.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-sm font-medium tracking-wide text-muted uppercase">Recent decisions</h2>
            <ul className="mt-2 flex flex-col gap-2">
              {done.map((row) => (
                <li key={row.id} className="rounded-lg border border-border bg-surface px-3 py-3 text-sm">
                  <p className="font-medium text-fg" dir="auto">
                    {row.name_en || row.name_ar}
                  </p>
                  <p className="text-muted">
                    {row.status === "active" ? "Approved" : "Rejected"}
                    {row.decision_note ? ` — ${row.decision_note}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
