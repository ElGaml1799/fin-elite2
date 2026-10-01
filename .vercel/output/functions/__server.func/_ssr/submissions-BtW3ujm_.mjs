import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { i as stripLegal, r as normalizeArabic } from "./normalize-yDe2QUkr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/submissions-BtW3ujm_.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function asBanks(value) {
	if (!Array.isArray(value)) return [];
	return value.filter((b) => b === "EIB" || b === "DIB");
}
function text(value, max) {
	return String(value ?? "").trim().slice(0, max);
}
var listActive = createServerFn({ method: "GET" }).handler(createSsrRpc("023ca103154aa477c2fedcaac78e42a34cfc8b924bf0cfaa49933b5adc0f79df"));
var listQueue = createServerFn({ method: "GET" }).handler(createSsrRpc("de88acf98a66131ef14e0cb6030e935753b13c2915f46e1c0658dec2e74a7ff7"));
var submitCompany = createServerFn({ method: "POST" }).validator((input) => {
	const src = input ?? {};
	const nameAr = text(src.nameAr, 200);
	const nameEn = text(src.nameEn, 200);
	const banks = asBanks(src.banks);
	const notes = text(src.notes, 500);
	const overrideReason = text(src.overrideReason, 300);
	if (normalizeArabic(nameAr).length < 2 && stripLegal(nameEn).length < 2) throw new Error("Enter an Arabic or English name");
	if (!banks.length) throw new Error("Select at least one bank");
	return {
		nameAr,
		nameEn,
		banks,
		notes,
		overrideReason
	};
}).handler(createSsrRpc("dbea33a025369ec172f654996987153e982b6967cfbaace2ba3e2a8818f5aca0"));
var decideSubmission = createServerFn({ method: "POST" }).validator((input) => {
	const src = input ?? {};
	const id = text(src.id, 80);
	const action = src.action === "approve" || src.action === "reject" ? src.action : "";
	const reason = text(src.reason, 400);
	if (!id || !action) throw new Error("Missing decision");
	if (action === "reject" && reason.length < 3) throw new Error("A reject reason is required");
	return {
		id,
		action,
		reason
	};
}).handler(createSsrRpc("8035f7ac623638500fa516fcd8cbc87ff9c2352271f45e8bee91294d9ee63a91"));
var flagCompany = createServerFn({ method: "POST" }).validator((input) => {
	const src = input ?? {};
	const companyId = text(src.companyId, 80);
	const note = text(src.note, 300);
	if (!companyId || note.length < 3) throw new Error("Add a short note");
	return {
		companyId,
		note
	};
}).handler(createSsrRpc("10c22a0e77a28ef7ea78be4d7de051cff2d21fbf801dddadffba420bdf72a607"));
//#endregion
export { submitCompany as a, listQueue as i, flagCompany as n, listActive as r, decideSubmission as t };
