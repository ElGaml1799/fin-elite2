import { o as __toESM } from "../_runtime.mjs";
import { J as require_react, x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as listQueue, t as decideSubmission } from "./submissions-BtW3ujm_.mjs";
import { t as format } from "../_libs/date-fns.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/review-Vg9fWMpi.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function when(value) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return format(date, "d MMM yyyy, HH:mm");
}
function ReviewQueue() {
	const [rows, setRows] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)("");
	const [reason, setReason] = (0, import_react.useState)({});
	const [busy, setBusy] = (0, import_react.useState)("");
	function reload() {
		return listQueue().then(setRows).catch(() => setError("The review queue did not load."));
	}
	(0, import_react.useEffect)(() => {
		let live = true;
		listQueue().then((next) => {
			if (live) setRows(next);
		}).catch(() => {
			if (live) setError("The review queue did not load.");
		});
		return () => {
			live = false;
		};
	}, []);
	const pending = rows?.filter((row) => row.status === "pending") ?? [];
	const done = rows?.filter((row) => row.status !== "pending") ?? [];
	function decide(id, action) {
		setBusy(id);
		setError("");
		decideSubmission({ data: {
			id,
			action,
			reason: reason[id] ?? ""
		} }).then((result) => {
			if (!result.ok) {
				setError(result.error);
				setBusy("");
				return;
			}
			return reload();
		}).catch((err) => setError(err instanceof Error ? err.message : "Could not save")).finally(() => setBusy(""));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-1 bg-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto w-full max-w-2xl px-4 py-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "inline-flex min-h-11 items-center text-sm font-medium text-primary",
					children: "Back to search"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 text-2xl font-semibold text-fg",
					children: "Review queue"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "Approve a name to put it on the search list. Reject it to keep it off. This preview has no sign-in, so treat the queue as open to anyone with the link."
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-hold",
					children: error
				}) : null,
				rows === null && !error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-6 text-sm text-muted",
					children: "Loading requests…"
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium tracking-wide text-muted uppercase",
						children: "Pending"
					}), rows && pending.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "Nothing waiting."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2 flex flex-col gap-3",
						children: pending.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "rounded-lg border border-border bg-surface px-3 py-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium text-fg",
									dir: "auto",
									children: row.name_en || row.name_ar
								}),
								row.name_ar && row.name_en ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									dir: "auto",
									children: row.name_ar
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-fg",
									children: row.banks.replaceAll(",", " · ")
								}),
								row.notes ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm text-pretty text-muted",
									dir: "auto",
									children: row.notes
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-xs text-muted tabular-nums",
									children: when(row.created_at)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "mt-3 block text-xs font-medium text-muted",
									htmlFor: `reason-${row.id}`,
									children: "Note (required to reject)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									id: `reason-${row.id}`,
									value: reason[row.id] ?? "",
									onChange: (event) => setReason((current) => ({
										...current,
										[row.id]: event.target.value
									})),
									rows: 2,
									className: "mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 grid grid-cols-2 gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										disabled: busy === row.id,
										onClick: () => decide(row.id, "approve"),
										className: "min-h-11 rounded-md bg-primary text-sm font-medium text-primary-fg disabled:opacity-50",
										children: "Approve"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										disabled: busy === row.id || (reason[row.id] ?? "").trim().length < 3,
										onClick: () => decide(row.id, "reject"),
										className: "min-h-11 rounded-md border border-border bg-bg text-sm font-medium text-fg disabled:opacity-50",
										children: "Reject"
									})]
								})
							]
						}, row.id))
					})]
				}),
				done.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium tracking-wide text-muted uppercase",
						children: "Recent decisions"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2 flex flex-col gap-2",
						children: done.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "rounded-lg border border-border bg-surface px-3 py-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium text-fg",
								dir: "auto",
								children: row.name_en || row.name_ar
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-muted",
								children: [row.status === "active" ? "Approved" : "Rejected", row.decision_note ? ` — ${row.decision_note}` : ""]
							})]
						}, row.id))
					})]
				}) : null
			]
		})]
	});
}
function ReviewPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReviewQueue, {});
}
//#endregion
export { ReviewPage as component };
