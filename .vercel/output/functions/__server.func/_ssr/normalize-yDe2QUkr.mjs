//#region node_modules/.nitro/vite/services/ssr/assets/normalize-yDe2QUkr.js
var LEGAL = /\b(l\s*l\s*c|p\s*j\s*s\s*c|l\s*l\s*p|fz\s*llc|llc|fzco|fze|pjsc|psc|ltd|limited|wll|llp|plc|dmcc|gmbh|inc|corp|bv|bvi|spc|fz)\b/g;
var DIGRAPHS = [
	["ش", "sh"],
	["خ", "kh"],
	["غ", "gh"],
	["ث", "th"],
	["ذ", "dh"]
];
var LETTERS = {
	ا: "a",
	أ: "a",
	إ: "a",
	آ: "a",
	ٱ: "a",
	ب: "b",
	ت: "t",
	ث: "th",
	ج: "j",
	ح: "h",
	خ: "kh",
	د: "d",
	ذ: "dh",
	ر: "r",
	ز: "z",
	س: "s",
	ش: "sh",
	ص: "s",
	ض: "d",
	ط: "t",
	ظ: "z",
	ع: "",
	غ: "gh",
	ف: "f",
	ق: "q",
	ك: "k",
	ل: "l",
	م: "m",
	ن: "n",
	ه: "h",
	ة: "h",
	و: "w",
	ي: "y",
	ى: "a",
	ؤ: "w",
	ئ: "y",
	ء: ""
};
/** Arabic spelling variants staff and clients actually type. */
var ALIASES = [
	["مصرف الامارات الاسلامي", "emirates islamic"],
	["بنك دبي الاسلامي", "dubai islamic"],
	["ماجد الفطيم", "majid al futtaim"],
	["طيران الامارات", "emirates airline"],
	["الاتحاد للطيران", "etihad"],
	["راس الخيمه", "ras al khaimah"],
	["ام القيوين", "umm al quwain"],
	["ابوظبي", "abu dhabi"],
	["الشارقه", "sharjah"],
	["الفجيره", "fujairah"],
	["الامارات", "emirates"],
	["الفطيم", "futtaim"],
	["مبادله", "mubadala"],
	["اتصالات", "etisalat"],
	["عجمان", "ajman"],
	["ادنوك", "adnoc"],
	["اعمار", "emaar"],
	["الدار", "aldar"],
	["ديوا", "dewa"],
	["دبي", "dubai"]
];
function normalizeArabic(input) {
	let s = String(input || "");
	s = s.replace(/\u0640/g, "");
	s = s.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "");
	s = s.replace(/[أإآٱ]/g, "ا");
	s = s.replace(/ؤ/g, "و").replace(/ئ/g, "ي").replace(/ء/g, "");
	s = s.replace(/ى/g, "ي");
	s = s.replace(/ة/g, "ه");
	s = s.replace(/ک/g, "ك");
	s = s.replace(/[^\u0621-\u063A\u0641-\u064Aa-zA-Z0-9\s]/g, " ");
	return s.replace(/\s+/g, " ").trim();
}
function normalizeEnglish(input) {
	let s = String(input || "").toLowerCase();
	s = s.replace(/&/g, " and ");
	s = s.replace(/[^a-z0-9\u0600-\u06ff\s]/g, " ");
	return s.replace(/\s+/g, " ").trim();
}
function stripLegal(input) {
	return normalizeEnglish(input).replace(LEGAL, " ").replace(/\s+/g, " ").trim();
}
function transliterate(arabicNorm) {
	let out = "";
	for (const ch of arabicNorm) {
		if (ch === " ") {
			out += " ";
			continue;
		}
		const pair = DIGRAPHS.find((p) => p[0] === ch);
		out += pair ? pair[1] : LETTERS[ch] ?? (/[a-z0-9]/.test(ch) ? ch : "");
	}
	return out.replace(/\s+/g, " ").trim();
}
function latinVariants(input) {
	const raw = input.trim();
	if (raw.length < 2) return [];
	if (!/[\u0600-\u06FF]/.test(raw)) {
		const n = stripLegal(raw);
		return n.length >= 2 ? [n] : [];
	}
	const na = normalizeArabic(raw);
	const found = /* @__PURE__ */ new Set();
	for (const [ar, en] of ALIASES) if (na.includes(ar)) found.add(en);
	const latin = stripLegal(transliterate(na));
	if (latin.length >= 2) found.add(latin);
	const g = latin.replace(/q/g, "g");
	if (g !== latin && g.length >= 2) found.add(g);
	for (const v of found) {
		const noAl = v.replace(/^al\s+/, "");
		if (noAl.length >= 2 && noAl !== v) found.add(noAl);
	}
	return [...found];
}
function levenshteinRatio(a, b) {
	if (a === b) return 0;
	if (!a || !b) return 1;
	const maxLen = Math.max(a.length, b.length);
	if (Math.abs(a.length - b.length) / maxLen > .5) return 1;
	let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
	let cur = new Array(b.length + 1);
	for (let i = 1; i <= a.length; i++) {
		cur[0] = i;
		for (let j = 1; j <= b.length; j++) {
			const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
			cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
		}
		const swap = prev;
		prev = cur;
		cur = swap;
	}
	return prev[b.length] / maxLen;
}
//#endregion
export { stripLegal as i, levenshteinRatio as n, normalizeArabic as r, latinVariants as t };
