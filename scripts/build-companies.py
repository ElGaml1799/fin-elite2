#!/usr/bin/env python3
"""Build public/companies.json from the two bank workbooks."""
import json
import re
from openpyxl import load_workbook

SRC = "/workspace/attachments/Listed Company.xlsx"
OUT = "/workspace/public/companies.json"

HOLD = re.compile(
    r"hold on all|on hold|facilities on hold|credit facilities on hold|all retail credit",
    re.I,
)
RESTRICTED = re.compile(r"not eligible|restricted|downgraded", re.I)


def clean(value) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def risk_of(text: str) -> str:
    if HOLD.search(text):
        return "hold"
    if RESTRICTED.search(text):
        return "restricted"
    return "clear"


def merge_key(name: str) -> str:
    s = name.upper()
    s = re.sub(r"[^A-Z0-9 ]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def clip(text: str, n: int = 220) -> str:
    text = clean(text)
    if len(text) <= n:
        return text
    return text[: n - 1].rstrip() + "…"


wb = load_workbook(SRC, read_only=True, data_only=True)
records: dict[str, dict] = {}

ws = wb["Emirates Islamic Bank"]
for i, row in enumerate(ws.iter_rows(values_only=True)):
    if i == 0:
        continue
    name = clean(row[0])
    if not name:
        continue
    key = merge_key(name)
    remark = clip(row[1])
    rec = {
        "id": f"eib-{i}",
        "name": name,
        "banks": ["EIB"],
        "risk": risk_of(remark),
    }
    cat = clean(row[3])
    group = clean(row[2])
    emirate = clean(row[7])
    industry = clean(row[8])
    po = clean(row[4])
    if cat:
        rec["eibCat"] = cat
    if group:
        rec["group"] = group
    if emirate:
        rec["emirate"] = emirate
    if industry:
        rec["industry"] = industry
    if po and po != "0":
        rec["po"] = po
    if remark:
        rec["remark"] = remark
    records[key] = rec

ws = wb["Dubai Islamic Bank"]
for i, row in enumerate(ws.iter_rows(values_only=True)):
    if i == 0:
        continue
    name = clean(row[1])
    if not name:
        continue
    key = merge_key(name)
    remark = clip(row[10])
    eid = clean(row[0])
    cat = clean(row[5])
    group = clean(row[11])
    industry = clean(row[14])
    risk = risk_of(remark)
    if key in records:
        rec = records[key]
        if "DIB" not in rec["banks"]:
            rec["banks"].append("DIB")
        if cat:
            rec["dibCat"] = cat
        if eid:
            rec["employerId"] = eid
        if group and not rec.get("group"):
            rec["group"] = group
        if industry and not rec.get("industry"):
            rec["industry"] = industry
        if remark:
            prev = rec.get("remark", "")
            rec["remark"] = clip((prev + " · " if prev else "") + remark, 280)
        order = {"clear": 0, "restricted": 1, "hold": 2}
        if order[risk] > order.get(rec["risk"], 0):
            rec["risk"] = risk
        continue
    rec = {
        "id": f"dib-{eid or i}",
        "name": name,
        "banks": ["DIB"],
        "risk": risk,
    }
    if cat:
        rec["dibCat"] = cat
    if group:
        rec["group"] = group
    if industry:
        rec["industry"] = industry
    if eid:
        rec["employerId"] = eid
    if remark:
        rec["remark"] = remark
    records[key] = rec

wb.close()
companies = list(records.values())
companies.sort(key=lambda r: r["name"])
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(companies, f, ensure_ascii=False, separators=(",", ":"))
print("companies", len(companies))
print("bytes", __import__("os").path.getsize(OUT))
