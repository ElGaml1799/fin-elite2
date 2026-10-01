import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { i as stripLegal, r as normalizeArabic } from "./normalize-yDe2QUkr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/submissions-DRTTAQuH.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var _0002_company_submissions_default = "create table if not exists company_submissions (\n  id text primary key,\n  name_ar text not null default '',\n  name_en text not null default '',\n  norm_en text not null default '',\n  norm_ar text not null default '',\n  banks text not null,\n  notes text not null default '',\n  status text not null default 'pending' check (status in ('pending', 'active', 'rejected')),\n  decision_note text not null default '',\n  created_at timestamptz not null default now(),\n  decided_at timestamptz\n);\n\ncreate index if not exists company_submissions_status_idx on company_submissions (status);\ncreate index if not exists company_submissions_norm_en_idx on company_submissions (norm_en);\n\ncreate table if not exists company_audit (\n  id serial primary key,\n  at timestamptz not null default now(),\n  action text not null,\n  submission_id text not null,\n  detail text not null default ''\n);\n";
/**
* Migration bookkeeping shared by the two appliers — `scripts/migrate.mjs`
* (deploy, `readdir`) and `src/lib/db.ts` (PGLite preview, `import.meta.glob`).
*
* Applied files are keyed by BASENAME, so the same file applies once no matter
* which directory it is globbed from. That is what makes the auth schema safe to
* copy from `migrations/auth/` into `migrations/` when an app turns sign-in on:
* a database that already has `0001_auth.sql` will not re-run it.
*
* Neither applier descends into subdirectories, so `migrations/auth/*.sql` is
* out of scope for both until it is copied up.
*/
/**
* The `_migrations` key for a migration path (or bare filename).
* @param {string} path
* @returns {string}
*/
function migrationName(path) {
	return path.split("/").pop() ?? path;
}
/**
* @param {string} path
* @returns {boolean}
*/
function isMigrationFile(path) {
	return path.endsWith(".sql");
}
/**
* Migrations in `paths` that are not yet in `applied`, in apply order.
* Non-`.sql` entries (a `readdir` also yields `migrations/auth/`) are dropped.
* @param {Iterable<string>} paths
* @param {Iterable<string>} applied
* @returns {Array<{ name: string, path: string }>}
*/
function pendingMigrations(paths, applied) {
	const done = new Set(applied);
	return [...paths].filter(isMigrationFile).map((path) => ({
		name: migrationName(path),
		path
	})).sort((a, b) => a.name.localeCompare(b.name)).filter(({ name }) => !done.has(name));
}
var rawDatabaseUrl = typeof process !== "undefined" ? process.env.DATABASE_URL : void 0;
var databaseUrl = rawDatabaseUrl && rawDatabaseUrl.trim() ? rawDatabaseUrl : void 0;
/**
* Active backend: real **Neon** when `DATABASE_URL` is set (deployed / configured
* sandbox), otherwise a local embedded **PGLite** (Postgres compiled to WASM) so
* the app has a working database even with nothing configured — the live preview
* included. Swap in Neon later by just setting `DATABASE_URL`; no code changes.
*/
var dbSource = databaseUrl ? "neon" : "pglite";
/**
* Init state lives on globalThis as promises: dev HMR creates new instances of
* this module, and two instances racing module-level state would open a second
* pool or run two concurrent PGLite migration passes (whose duplicate
* `_migrations` insert rejects — and would get memoized, poisoning every later
* `getSql()`). A failed init clears its slot so the next call retries.
*/
var globalRef = globalThis;
/**
* Result-type parity: Postgres sends every value as text plus a type OID — the
* JS value is the DRIVER's parsing choice, and pg and PGLite disagree (pg:
* int8 -> string, date -> local-midnight Date; PGLite: int8 -> BigInt, which
* JSON.stringify rejects, date -> UTC Date). Normalize both so preview and
* production return identical, JSON-safe shapes:
*   int8/bigint (incl. count(*)) -> number (past 2^53 loses precision — cast
*                                   `::text` if you ever need huge integers)
*   date                         -> 'YYYY-MM-DD' string
*   interval                     -> Postgres interval text
* numeric already comes back as a string on both (arbitrary precision).
*/
var OID_INT8 = 20;
var OID_DATE = 1082;
var OID_INTERVAL = 1186;
var identity = (v) => v;
/** Wrap a query runner in the tagged-template + `.query()` `Sql` surface. */
function toSql(run) {
	const sql = (async (strings, ...values) => {
		let text = strings[0];
		for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
		return run(text, values);
	});
	sql.query = (text, params = []) => run(text, params);
	return sql;
}
function createNeonSql() {
	globalRef.__pgSqlPromise__ ??= (async () => {
		const { Pool, types } = await import("../_libs/pg.mjs").then((n) => n.t);
		types.setTypeParser(OID_INT8, Number);
		types.setTypeParser(OID_DATE, identity);
		types.setTypeParser(OID_INTERVAL, identity);
		const pool = new Pool({ connectionString: databaseUrl });
		return toSql(async (text, params) => {
			return (await pool.query(text, params)).rows;
		});
	})().catch((err) => {
		globalRef.__pgSqlPromise__ = void 0;
		throw err;
	});
	return globalRef.__pgSqlPromise__;
}
async function createPgliteSql() {
	globalRef.__pgliteInstance__ ??= (async () => {
		const { PGlite } = await import("../_libs/electric-sql__pglite.mjs").then((n) => n.t);
		const pg = new PGlite({ parsers: {
			[OID_INT8]: Number,
			[OID_DATE]: identity,
			[OID_INTERVAL]: identity
		} });
		await pg.waitReady;
		await pg.exec("create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())");
		return pg;
	})().catch((err) => {
		globalRef.__pgliteInstance__ = void 0;
		throw err;
	});
	const pg = await globalRef.__pgliteInstance__;
	const migrate = async () => {
		const migrations = /* #__PURE__ */ Object.assign({ "/migrations/0002_company_submissions.sql": _0002_company_submissions_default });
		const done = (await pg.query("select name from _migrations")).rows.map((r) => r.name);
		for (const { name, path } of pendingMigrations(Object.keys(migrations), done)) await pg.transaction(async (tx) => {
			await tx.exec(migrations[path]);
			await tx.query("insert into _migrations (name) values ($1)", [name]);
		});
	};
	const pass = (globalRef.__pgliteMigrateChain__ ?? Promise.resolve()).catch(() => void 0).then(migrate);
	globalRef.__pgliteMigrateChain__ = pass;
	await pass;
	return toSql(async (text, params) => {
		return (await pg.query(text, params)).rows;
	});
}
var sqlPromise = null;
async function createSql() {
	if (typeof window !== "undefined") throw new Error("@/lib/db is server-only — call getSql() from a createServerFn handler or a server route loader, never from client code.");
	return dbSource === "neon" ? createNeonSql() : createPgliteSql();
}
/**
* Get the shared, **server-only** SQL client. Neon when `DATABASE_URL` is set,
* otherwise the local PGLite fallback. Memoized — safe to call per request.
*
* Schema comes from `migrations/*.sql`, auto-applied before the first query on
* both backends — define tables there, never inline in server functions.
*/
function getSql() {
	sqlPromise ??= createSql().catch((err) => {
		sqlPromise = null;
		throw err;
	});
	return sqlPromise;
}
/**
* Finish DB bootstrap before the server handles traffic.
*
* - **PGLite** (preview / no `DATABASE_URL`): open the in-memory DB and apply
*   `migrations/*.sql`. Idempotent — concurrent callers share one promise.
* - **Neon**: no-op (pool is created lazily on first query).
*
* Vite `configureServer` awaits this at dev startup; production imports of this
* module kick it off immediately (see bottom of file).
*/
function ensureDbReady() {
	if (dbSource !== "pglite") return Promise.resolve();
	return getSql().then(() => void 0);
}
var globalBoot = globalThis;
if (typeof window === "undefined" && dbSource === "pglite") globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err) => {
	globalBoot.__pgBootstrapPromise__ = void 0;
	console.error("[db] PGLite bootstrap failed:", err);
	throw err;
});
function asBanks(value) {
	if (!Array.isArray(value)) return [];
	return value.filter((b) => b === "EIB" || b === "DIB");
}
function text(value, max) {
	return String(value ?? "").trim().slice(0, max);
}
var listActive_createServerFn_handler = createServerRpc({
	id: "023ca103154aa477c2fedcaac78e42a34cfc8b924bf0cfaa49933b5adc0f79df",
	name: "listActive",
	filename: "src/lib/submissions.ts"
}, (opts) => listActive.__executeServer(opts));
var listActive = createServerFn({ method: "GET" }).handler(listActive_createServerFn_handler, async () => {
	return (await getSql())`
    select id, name_en, name_ar, banks, notes
    from company_submissions
    where status = 'active'
    order by created_at desc
    limit 200
  `;
});
var listQueue_createServerFn_handler = createServerRpc({
	id: "de88acf98a66131ef14e0cb6030e935753b13c2915f46e1c0658dec2e74a7ff7",
	name: "listQueue",
	filename: "src/lib/submissions.ts"
}, (opts) => listQueue.__executeServer(opts));
var listQueue = createServerFn({ method: "GET" }).handler(listQueue_createServerFn_handler, async () => {
	return (await getSql())`
    select id, name_en, name_ar, banks, notes, status, decision_note,
           to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
    from company_submissions
    order by case when status = 'pending' then 0 else 1 end, created_at desc
    limit 100
  `;
});
var submitCompany_createServerFn_handler = createServerRpc({
	id: "dbea33a025369ec172f654996987153e982b6967cfbaace2ba3e2a8818f5aca0",
	name: "submitCompany",
	filename: "src/lib/submissions.ts"
}, (opts) => submitCompany.__executeServer(opts));
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
}).handler(submitCompany_createServerFn_handler, async ({ data }) => {
	const sql = await getSql();
	const normEn = stripLegal(data.nameEn);
	const normAr = normalizeArabic(data.nameAr);
	if ((await sql`
      select id from company_submissions
      where status in ('pending', 'active')
        and (
          (${normEn} <> '' and norm_en = ${normEn})
          or (${normAr} <> '' and norm_ar = ${normAr})
        )
      limit 3
    `).length && data.overrideReason.length < 15) return {
		ok: false,
		error: "A similar company is already submitted or approved. Explain in 15+ characters to send it anyway."
	};
	const id = crypto.randomUUID();
	const notes = data.overrideReason ? `${data.notes}${data.notes ? "\n" : ""}Similar name noted: ${data.overrideReason}`.slice(0, 800) : data.notes;
	await sql`
      insert into company_submissions (id, name_ar, name_en, norm_en, norm_ar, banks, notes)
      values (${id}, ${data.nameAr}, ${data.nameEn}, ${normEn}, ${normAr}, ${data.banks.join(",")}, ${notes})
    `;
	await sql`
      insert into company_audit (action, submission_id, detail)
      values ('add_request', ${id}, ${notes.slice(0, 300)})
    `;
	return {
		ok: true,
		id,
		status: "pending"
	};
});
var decideSubmission_createServerFn_handler = createServerRpc({
	id: "8035f7ac623638500fa516fcd8cbc87ff9c2352271f45e8bee91294d9ee63a91",
	name: "decideSubmission",
	filename: "src/lib/submissions.ts"
}, (opts) => decideSubmission.__executeServer(opts));
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
}).handler(decideSubmission_createServerFn_handler, async ({ data }) => {
	const sql = await getSql();
	const status = data.action === "approve" ? "active" : "rejected";
	if (!(await sql`
      update company_submissions
      set status = ${status},
          decision_note = ${data.reason},
          decided_at = now()
      where id = ${data.id} and status = 'pending'
      returning id
    `).length) return {
		ok: false,
		error: "That request is no longer pending"
	};
	await sql`
      insert into company_audit (action, submission_id, detail)
      values (${data.action}, ${data.id}, ${data.reason})
    `;
	return {
		ok: true,
		status
	};
});
var flagCompany_createServerFn_handler = createServerRpc({
	id: "10c22a0e77a28ef7ea78be4d7de051cff2d21fbf801dddadffba420bdf72a607",
	name: "flagCompany",
	filename: "src/lib/submissions.ts"
}, (opts) => flagCompany.__executeServer(opts));
var flagCompany = createServerFn({ method: "POST" }).validator((input) => {
	const src = input ?? {};
	const companyId = text(src.companyId, 80);
	const note = text(src.note, 300);
	if (!companyId || note.length < 3) throw new Error("Add a short note");
	return {
		companyId,
		note
	};
}).handler(flagCompany_createServerFn_handler, async ({ data }) => {
	await (await getSql())`
      insert into company_audit (action, submission_id, detail)
      values ('flag', ${data.companyId}, ${data.note})
    `;
	return { ok: true };
});
//#endregion
export { decideSubmission_createServerFn_handler, flagCompany_createServerFn_handler, listActive_createServerFn_handler, listQueue_createServerFn_handler, submitCompany_createServerFn_handler };
