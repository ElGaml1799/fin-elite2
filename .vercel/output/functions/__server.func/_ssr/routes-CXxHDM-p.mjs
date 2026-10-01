import { o as __toESM } from "../_runtime.mjs";
import { J as require_react, x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as stripLegal, n as levenshteinRatio, t as latinVariants } from "./normalize-yDe2QUkr.mjs";
import { a as submitCompany, i as listQueue, n as flagCompany, r as listActive } from "./submissions-BtW3ujm_.mjs";
import { i as Plus, n as TriangleAlert, r as Search, t as X } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CXxHDM-p.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var cache = null;
function loadCompanies() {
	cache ??= fetch("/companies.json").then((res) => {
		if (!res.ok) throw new Error("Could not load the company list");
		return res.json();
	}).catch((err) => {
		cache = null;
		throw err;
	});
	return cache;
}
var STOP = /* @__PURE__ */ new Set([
	"al",
	"the",
	"and",
	"of",
	"for",
	"co",
	"company"
]);
function tokensOf(norm) {
	return norm.split(" ").filter((t) => t.length >= 2 && !STOP.has(t));
}
function buildCatalog(companies) {
	const items = [];
	const byNorm = /* @__PURE__ */ new Map();
	const byToken = /* @__PURE__ */ new Map();
	const seen = /* @__PURE__ */ new Set();
	const tokensByLetter = /* @__PURE__ */ new Map();
	for (const company of companies) {
		const norm = stripLegal(company.name);
		const tokens = tokensOf(norm);
		const idx = items.length;
		items.push({
			company,
			norm,
			tokens
		});
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
	return {
		items,
		byNorm,
		byToken,
		tokensByLetter
	};
}
function fuzzyTokens(catalog, qt) {
	if (qt.length < 4) return [];
	const bucket = catalog.tokensByLetter.get(qt[0]) ?? [];
	const out = [];
	for (const token of bucket) {
		if (token === qt) continue;
		if (Math.abs(token.length - qt.length) > 2) continue;
		const ratio = levenshteinRatio(qt, token);
		if (ratio > 0 && ratio <= .34) out.push({
			token,
			ratio
		});
	}
	out.sort((a, b) => a.ratio - b.ratio);
	return out.slice(0, 6);
}
function searchVariant(catalog, variant, arabic, best, phase) {
	const consider = (idx, score, kind) => {
		const prev = best.get(idx);
		if (!prev || score < prev.score) best.set(idx, {
			score,
			kind
		});
	};
	const kindAlias = arabic ? "alias" : "prefix";
	const significant = variant.split(" ").filter((t) => t.length >= 3 && !STOP.has(t));
	if (phase === "cheap") {
		for (let idx = 0; idx < catalog.items.length; idx++) {
			const norm = catalog.items[idx].norm;
			if (norm === variant) consider(idx, 0, arabic ? "alias" : "exact");
			else if (variant.length >= 2 && norm.startsWith(variant)) consider(idx, .07, "prefix");
			else if (variant.length >= 5 && norm.includes(variant)) consider(idx, .16, "prefix");
		}
		for (const qt of significant) {
			const direct = catalog.byToken.get(qt);
			if (direct) for (const idx of direct) consider(idx, .1, kindAlias);
			if (qt.length < 3) continue;
			for (const token of catalog.tokensByLetter.get(qt[0]) ?? []) if (token.length >= qt.length && token.startsWith(qt) && token !== qt) {
				const ids = catalog.byToken.get(token);
				if (ids) for (const idx of ids) consider(idx, .17, "prefix");
			}
		}
	} else for (const qt of significant) {
		if (qt.length < 4) continue;
		for (const hit of fuzzyTokens(catalog, qt)) {
			const ids = catalog.byToken.get(hit.token);
			if (!ids) continue;
			for (const idx of ids) consider(idx, .2 + hit.ratio * .4, "fuzzy");
		}
	}
	if (phase === "cheap" && significant.length >= 2 && best.size <= 400) for (const [idx, hit] of best) {
		const tokens = catalog.items[idx].tokens;
		if (significant.every((qt) => tokens.some((t) => t === qt || t.startsWith(qt) || qt.length >= 4 && levenshteinRatio(qt, t) <= .34))) hit.score = Math.min(hit.score, .04);
	}
}
function searchCatalog(catalog, query, limit = 8) {
	const variants = latinVariants(query);
	if (!variants.length) return [];
	const arabic = /[\u0600-\u06FF]/.test(query);
	const best = /* @__PURE__ */ new Map();
	for (const variant of variants) searchVariant(catalog, variant, arabic, best, "cheap");
	if ([...best.values()].filter((h) => h.score <= .12).length < 5) for (const variant of variants) searchVariant(catalog, variant, arabic, best, "fuzzy");
	return [...best.entries()].map(([idx, hit]) => ({
		company: catalog.items[idx].company,
		score: hit.score,
		kind: hit.kind
	})).sort((a, b) => a.score - b.score || a.company.name.localeCompare(b.company.name)).slice(0, limit);
}
function findDuplicates(catalog, nameEn, nameAr) {
	const queries = [.../* @__PURE__ */ new Set([...latinVariants(nameEn), ...latinVariants(nameAr)])].filter((q) => q.length >= 3);
	const best = /* @__PURE__ */ new Map();
	for (const q of queries) {
		const seeds = /* @__PURE__ */ new Set();
		for (const idx of catalog.byNorm.get(q) ?? []) seeds.add(idx);
		const parts = q.split(" ").filter((t) => t.length >= 3 && !STOP.has(t));
		const keys = parts.filter((t) => t.length >= 4);
		for (const t of keys.length ? keys : parts) {
			for (const idx of catalog.byToken.get(t) ?? []) seeds.add(idx);
			for (const hit of fuzzyTokens(catalog, t)) for (const idx of catalog.byToken.get(hit.token) ?? []) seeds.add(idx);
		}
		const qTokens = parts;
		for (const idx of seeds) {
			const item = catalog.items[idx];
			let score = levenshteinRatio(q, item.norm);
			if (qTokens.length) {
				let inter = 0;
				for (const t of qTokens) if (item.tokens.includes(t)) inter += 1;
				else if (item.tokens.some((u) => u[0] === t[0] && levenshteinRatio(t, u) <= .34)) inter += .75;
				const union = qTokens.length + item.tokens.length - inter;
				if (union > 0) score = Math.min(score, 1 - inter / union);
			}
			if (q.length >= 8 && (item.norm.includes(q) || q.includes(item.norm))) score = Math.min(score, .2);
			if (score <= .42) {
				const prev = best.get(idx);
				if (prev === void 0 || score < prev) best.set(idx, score);
			}
		}
	}
	return [...best.entries()].map(([idx, score]) => ({
		company: catalog.items[idx].company,
		score,
		kind: score === 0 ? "exact" : "fuzzy"
	})).sort((a, b) => a.score - b.score).slice(0, 5);
}
function isHardDuplicate(score) {
	return score <= .12;
}
var KIND = {
	exact: "Exact",
	prefix: "Name",
	fuzzy: "Spelling",
	alias: "Arabic"
};
function banksOf(value) {
	return value.split(",").map((b) => b.trim()).filter((b) => b === "EIB" || b === "DIB");
}
function BankChip({ bank }) {
	const dubai = bank === "DIB";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: dubai ? "inline-flex items-center rounded-full bg-dib px-2.5 py-1 text-xs font-medium text-dib-fg" : "inline-flex items-center rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-fg",
		children: dubai ? "Dubai Islamic" : "Emirates Islamic"
	});
}
function RiskChip({ risk }) {
	if (risk === "clear") return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex items-center gap-1 rounded-full bg-hold-bg px-2.5 py-1 text-xs font-medium text-hold",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
			className: "size-3.5",
			"aria-hidden": "true"
		}), risk === "hold" ? "Hold" : "Restricted"]
	});
}
function cats(company) {
	const parts = [];
	if (company.eibCat) parts.push(`EIB ${company.eibCat}`);
	if (company.dibCat) parts.push(`DIB ${company.dibCat}`);
	return parts.join(" · ");
}
function Lookup() {
	const [query, setQuery] = (0, import_react.useState)("");
	const [debounced, setDebounced] = (0, import_react.useState)("");
	const [base, setBase] = (0, import_react.useState)(null);
	const [added, setAdded] = (0, import_react.useState)([]);
	const [loadError, setLoadError] = (0, import_react.useState)("");
	const [selectedId, setSelectedId] = (0, import_react.useState)(null);
	const [addOpen, setAddOpen] = (0, import_react.useState)(false);
	const [pendingCount, setPendingCount] = (0, import_react.useState)(0);
	const [banner, setBanner] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		const t = setTimeout(() => setDebounced(query.trim()), 250);
		return () => clearTimeout(t);
	}, [query]);
	(0, import_react.useEffect)(() => {
		let live = true;
		loadCompanies().then((rows) => {
			if (live) setBase(rows);
		}).catch(() => {
			if (live) setLoadError("The company list did not load. Refresh and try again.");
		});
		const pullAdded = () => {
			listActive().then((rows) => {
				if (!live) return;
				setAdded(rows.map((row) => ({
					id: `add-${row.id}`,
					name: row.name_en || row.name_ar,
					banks: banksOf(row.banks),
					risk: "clear",
					remark: row.notes || void 0,
					added: true,
					...row.name_ar ? { group: row.name_ar } : {}
				})));
			}).catch(() => {});
			listQueue().then((rows) => {
				if (live) setPendingCount(rows.filter((row) => row.status === "pending").length);
			}).catch(() => void 0);
		};
		pullAdded();
		window.addEventListener("focus", pullAdded);
		return () => {
			live = false;
			window.removeEventListener("focus", pullAdded);
		};
	}, []);
	const catalog = (0, import_react.useMemo)(() => base ? buildCatalog([...base, ...added]) : null, [base, added]);
	const results = (0, import_react.useMemo)(() => catalog && debounced.length >= 2 ? searchCatalog(catalog, debounced, 8) : [], [catalog, debounced]);
	const selected = results.find((hit) => hit.company.id === selectedId)?.company ?? null;
	const holds = base?.filter((row) => row.risk === "hold").length ?? 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-1 bg-primary" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-28",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "sticky top-0 z-10 -mx-4 border-b border-border bg-bg/95 px-4 pt-4 pb-3 backdrop-blur-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-medium tracking-wide text-primary uppercase",
									children: "Employer list"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "mt-1 text-2xl font-semibold text-fg",
									children: "Company lookup"
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/review",
									className: "mt-1 inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium text-fg",
									children: ["Review", pendingCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-fg tabular-nums",
										children: pendingCount
									}) : null]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								dir: "auto",
								children: "اكتب اسم الشركة بالعربية أو الإنجليزية — النتائج تظهر أثناء الكتابة"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "mt-3 block",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "sr-only",
									children: "Company name"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "relative block",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											value: query,
											dir: "auto",
											autoFocus: true,
											autoComplete: "off",
											placeholder: "Company name",
											onChange: (event) => {
												setQuery(event.target.value);
												setSelectedId(null);
											},
											className: "min-h-12 w-full rounded-md border border-border bg-surface pr-11 pl-11 text-base text-fg placeholder:text-muted"
										}),
										query ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											"aria-label": "Clear search",
											onClick: () => {
												setQuery("");
												setSelectedId(null);
											},
											className: "absolute top-1/2 right-2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
										}) : null
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs text-muted tabular-nums",
								children: base ? `${base.length.toLocaleString()} listed · ${holds.toLocaleString()} on hold` : loadError ? loadError : "Loading listed companies…"
							})
						]
					}),
					banner ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 rounded-md border border-border bg-surface px-3 py-3 text-sm text-fg",
						children: banner
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
						className: "mt-3 flex-1",
						children: [
							debounced.length >= 2 && catalog && results.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg border border-border bg-surface px-4 py-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium text-fg",
										children: "No listed company"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-sm text-muted",
										children: "Check the spelling, or send this name for review."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => setAddOpen(true),
										className: "mt-4 inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-fg",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "Add company"]
									})
								]
							}) : null,
							results.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "flex flex-col gap-2",
								children: results.map((hit) => {
									const open = selectedId === hit.company.id;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										"aria-expanded": open,
										onClick: () => setSelectedId(open ? null : hit.company.id),
										className: "w-full rounded-lg border border-border bg-surface px-3 py-3 text-left",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-start justify-between gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-medium text-fg",
													dir: "auto",
													children: hit.company.name
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "shrink-0 text-xs text-muted",
													children: KIND[hit.kind]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "mt-2 flex flex-wrap gap-1.5",
												children: [
													hit.company.banks.map((bank) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BankChip, { bank }, bank)),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RiskChip, { risk: hit.company.risk }),
													hit.company.added ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "inline-flex items-center rounded-full border border-border px-2.5 py-1 text-xs text-muted",
														children: "Added"
													}) : null
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "mt-2 block text-sm text-muted",
												children: [
													hit.company.group,
													hit.company.emirate,
													cats(hit.company)
												].filter(Boolean).join(" · ")
											})
										]
									}), open && selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, { company: selected }) : null] }, hit.company.id);
								})
							}) : null,
							debounced.length < 2 && base ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-6 text-sm text-muted",
								children: "Type at least two letters. Misspellings and Arabic names such as الفطيم or أدنوك are matched to the English legal name."
							}) : null
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto max-w-2xl",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setAddOpen(true),
						className: "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-primary text-base font-medium text-primary-fg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-5" }), "Add company"]
					})
				})
			}),
			addOpen && catalog ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddSheet, {
				initialQuery: query,
				catalog,
				onClose: () => setAddOpen(false),
				onDone: () => {
					setAddOpen(false);
					setBanner("Sent for review. It appears in search only after someone approves it.");
					listQueue().then((rows) => setPendingCount(rows.filter((row) => row.status === "pending").length)).catch(() => void 0);
				}
			}) : null
		]
	});
}
function Detail({ company }) {
	const [note, setNote] = (0, import_react.useState)("");
	const [state, setState] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-2 rounded-lg border border-border bg-bg px-3 py-3",
		children: [
			company.risk !== "clear" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "rounded-md bg-hold-bg px-3 py-2 text-sm font-medium text-hold",
				children: [company.risk === "hold" ? "Hold on retail credit" : "Restriction on file", " — read the note before proceeding."]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium text-primary",
				children: "Listed. You can proceed with the usual checks."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
						label: "Category",
						value: cats(company)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
						label: "Group",
						value: company.group
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
						label: "Emirate",
						value: company.emirate
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
						label: "Industry",
						value: company.industry
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
						label: "P.O. Box",
						value: company.po
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
						label: "Employer ID",
						value: company.employerId
					})
				]
			}),
			company.remark ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-pretty text-fg",
				dir: "auto",
				children: company.remark
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-3",
				onSubmit: (event) => {
					event.preventDefault();
					setState("Saving…");
					flagCompany({ data: {
						companyId: company.id,
						note
					} }).then(() => {
						setState("Noted for the reviewer.");
						setNote("");
					}).catch(() => setState("Could not save the note."));
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "block text-xs font-medium text-muted",
						htmlFor: `flag-${company.id}`,
						children: "Flag a problem with this record"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						id: `flag-${company.id}`,
						value: note,
						dir: "auto",
						onChange: (event) => setNote(event.target.value),
						rows: 2,
						maxLength: 300,
						className: "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						disabled: note.trim().length < 3,
						className: "mt-2 inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium text-fg disabled:opacity-50",
						children: "Save note"
					}),
					state ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs text-muted",
						children: state
					}) : null
				]
			})
		]
	});
}
function Fact({ label, value }) {
	if (!value) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
		className: "text-xs text-muted",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
		className: "text-fg",
		dir: "auto",
		children: value
	})] });
}
function AddSheet({ initialQuery, catalog, onClose, onDone }) {
	const arabicQuery = /[\u0600-\u06FF]/.test(initialQuery);
	const [nameAr, setNameAr] = (0, import_react.useState)(arabicQuery ? initialQuery : "");
	const [nameEn, setNameEn] = (0, import_react.useState)(arabicQuery ? "" : initialQuery);
	const [banks, setBanks] = (0, import_react.useState)(["EIB"]);
	const [notes, setNotes] = (0, import_react.useState)("");
	const [overrideReason, setOverrideReason] = (0, import_react.useState)("");
	const [confirmed, setConfirmed] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const dupes = (0, import_react.useMemo)(() => findDuplicates(catalog, nameEn, nameAr), [
		catalog,
		nameEn,
		nameAr
	]);
	const hard = dupes.some((hit) => isHardDuplicate(hit.score));
	const needsConfirm = dupes.length > 0;
	const nameOk = nameAr.trim().length >= 2 || nameEn.trim().length >= 2;
	function toggle(bank) {
		setBanks((current) => current.includes(bank) ? current.filter((item) => item !== bank) : [...current, bank]);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-30 flex items-end justify-center bg-fg/40",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			"aria-label": "Close",
			className: "absolute inset-0",
			onClick: onClose
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": "add-title",
			className: "relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-lg border border-border bg-surface px-4 pt-4 pb-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						id: "add-title",
						className: "text-xl font-semibold text-fg",
						children: "Add company"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "It stays off the search list until a reviewer approves it."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Close add form",
						onClick: onClose,
						className: "inline-flex size-11 items-center justify-center rounded-md",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "mt-4 block text-sm font-medium text-fg",
					htmlFor: "name-ar",
					children: "Arabic name"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					id: "name-ar",
					dir: "auto",
					value: nameAr,
					onChange: (event) => {
						setNameAr(event.target.value);
						setConfirmed(false);
					},
					className: "mt-1 min-h-12 w-full rounded-md border border-border bg-bg px-3 text-base text-fg"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "mt-3 block text-sm font-medium text-fg",
					htmlFor: "name-en",
					children: "English name"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					id: "name-en",
					dir: "auto",
					value: nameEn,
					onChange: (event) => {
						setNameEn(event.target.value);
						setConfirmed(false);
					},
					className: "mt-1 min-h-12 w-full rounded-md border border-border bg-bg px-3 text-base text-fg"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted",
					children: "One of the two names is required."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm font-medium text-fg",
					children: "Banks"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 grid grid-cols-2 gap-2",
					children: ["EIB", "DIB"].map((bank) => {
						const on = banks.includes(bank);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-pressed": on,
							onClick: () => toggle(bank),
							className: on ? "min-h-12 rounded-md border border-primary bg-primary text-sm font-medium text-primary-fg" : "min-h-12 rounded-md border border-border bg-bg text-sm font-medium text-fg",
							children: bank === "EIB" ? "Emirates Islamic" : "Dubai Islamic"
						}, bank);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "mt-4 block text-sm font-medium text-fg",
					htmlFor: "notes",
					children: "Notes"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					id: "notes",
					dir: "auto",
					value: notes,
					maxLength: 500,
					rows: 3,
					onChange: (event) => setNotes(event.target.value),
					className: "mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg"
				}),
				dupes.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 rounded-md border border-hold/40 bg-hold-bg px-3 py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium text-hold",
							children: "Possible duplicates"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-2 flex flex-col gap-2",
							children: dupes.map((hit) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "text-sm text-fg",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: hit.company.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-1 flex flex-wrap gap-1",
									children: hit.company.banks.map((bank) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BankChip, { bank }, bank))
								})]
							}, hit.company.id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "mt-3 flex min-h-11 items-start gap-2 text-sm text-fg",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: confirmed,
								onChange: (event) => setConfirmed(event.target.checked),
								className: "mt-1 size-4"
							}), "None of these is the same company"]
						}),
						hard ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "mt-2 block text-sm font-medium text-fg",
								htmlFor: "override",
								children: "Why this is still a new company"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								id: "override",
								value: overrideReason,
								onChange: (event) => setOverrideReason(event.target.value),
								rows: 2,
								className: "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-muted",
								children: "At least 15 characters. A very close name cannot go through quietly."
							})
						] }) : null
					]
				}) : null,
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-hold",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: busy || !nameOk || banks.length === 0 || needsConfirm && !confirmed || hard && overrideReason.trim().length < 15,
					onClick: () => {
						setBusy(true);
						setError("");
						submitCompany({ data: {
							nameAr,
							nameEn,
							banks,
							notes,
							overrideReason: hard ? overrideReason : ""
						} }).then((result) => {
							if (!result.ok) {
								setError(result.error);
								setBusy(false);
								return;
							}
							onDone();
						}).catch((err) => {
							setError(err instanceof Error ? err.message : "Could not submit");
							setBusy(false);
						});
					},
					className: "mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-primary text-base font-medium text-primary-fg disabled:opacity-50",
					children: busy ? "Sending…" : "Submit for approval"
				})
			]
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lookup, {});
}
//#endregion
export { Home as component };
