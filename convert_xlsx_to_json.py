#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把「瑪奇物資.xlsx」轉換成網頁模擬器使用的 data.json

支援的表格格式（欄位標題所在列，透過尋找「地區」關鍵字自動定位）：
  地區 | NPC | 推薦 | 兌換物品 | 數量 | 所需物品 | 數量

品項分類（加工品／料理成品／一般取得材料／NPC物品等）透過該儲存格的
「填色」自動判斷，分類圖例請放在標題列之上，格式為：
  A欄＝分類名稱文字，同一列的其他儲存格填上該分類代表色。

用法: python3 scripts/convert_xlsx_to_json.py data.xlsx data.json
"""
import sys
import json
import re
import datetime
import openpyxl

UNCATEGORIZED = "未分類"


def build_merge_map(ws):
    merge_map = {}
    for mrange in ws.merged_cells.ranges:
        min_col, min_row, max_col, max_row = mrange.bounds
        top_val = ws.cell(row=min_row, column=min_col).value
        for r in range(min_row, max_row + 1):
            for c in range(min_col, max_col + 1):
                merge_map[(r, c)] = top_val
    return merge_map


def cell_value(ws, merge_map, row, col):
    if (row, col) in merge_map:
        return merge_map[(row, col)]
    return ws.cell(row=row, column=col).value


def color_key(cell):
    """回傳可比對用的顏色特徵 (type, value, tint)。"""
    fg = cell.fill.fgColor
    if fg is None:
        return None
    ftype = fg.type
    if ftype == "theme":
        theme = fg.theme
        if not isinstance(theme, int):
            return None
        tint = fg.tint if isinstance(fg.tint, (int, float)) else 0.0
        return ("theme", theme, round(tint, 3))
    if ftype == "rgb":
        rgb = fg.rgb
        if not isinstance(rgb, str) or rgb in ("00000000", None):
            return None
        return ("rgb", rgb, 0.0)
    if ftype == "indexed":
        idx = fg.indexed
        if not isinstance(idx, int):
            return None
        return ("indexed", idx, 0.0)
    return None


def parse_qty(value):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return int(value)
    text = str(value).strip()
    m = re.search(r"(\d+)", text)
    return int(m.group(1)) if m else None


def parse_flag(value):
    if value is None:
        return False
    text = str(value).strip()
    return text != ""


def find_header(ws, merge_map, max_row, max_col):
    for r in range(1, max_row + 1):
        for c in range(1, max_col + 1):
            v = cell_value(ws, merge_map, r, c)
            if v == "地區":
                return r
    raise RuntimeError("找不到標題列（需要有一欄標題為「地區」）")


def build_category_legend(ws, header_row, max_col):
    """
    在標題列之上尋找分類圖例：
    某一列的 A 欄是分類文字（例如「加工品」），
    同一列往右找到第一個有底色（非白/無色）的儲存格，取其顏色特徵作為該分類代表色。
    """
    legend = {}  # color_key -> label
    for r in range(1, header_row):
        label = ws.cell(row=r, column=1).value
        if not label:
            continue
        label = str(label).strip()
        if not label or label in ("品項類型",):
            continue
        for c in range(2, max_col + 1):
            key = color_key(ws.cell(row=r, column=c))
            if key is not None:
                legend[key] = label
                break
    return legend


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else "data.xlsx"
    dst = sys.argv[2] if len(sys.argv) > 2 else "data.json"

    wb = openpyxl.load_workbook(src, data_only=True)
    ws = wb.worksheets[0]
    merge_map = build_merge_map(ws)

    max_row = ws.max_row
    max_col = ws.max_column

    header_row = find_header(ws, merge_map, max_row, max_col)
    legend = build_category_legend(ws, header_row, max_col)

    # 依標題文字找到各欄位位置
    col_map = {}
    for c in range(1, max_col + 1):
        v = cell_value(ws, merge_map, header_row, c)
        if not v:
            continue
        v = str(v)
        if "地區" in v:
            col_map["region"] = c
        elif v.strip() == "NPC":
            col_map["npc"] = c
        elif "推薦" in v:
            col_map["recommended"] = c
        elif "兌換物品" in v:
            col_map["item"] = c
            col_map["item_qty"] = c + 1
        elif "所需物品" in v or "所需資源" in v:
            col_map["resource"] = c
            col_map["resource_qty"] = c + 1

    required = ["region", "npc", "item", "resource"]
    for req in required:
        if req not in col_map:
            raise RuntimeError(f"標題列缺少欄位: {req}")

    def lookup_category(cell):
        key = color_key(cell)
        label = legend.get(key)
        return label if label else UNCATEGORIZED

    rows = []
    item_category = {}

    for r in range(header_row + 1, max_row + 1):
        region = cell_value(ws, merge_map, r, col_map["region"])
        npc = cell_value(ws, merge_map, r, col_map["npc"])
        recommended = parse_flag(ws.cell(row=r, column=col_map["recommended"]).value) if col_map.get("recommended") else False

        item_cell = ws.cell(row=r, column=col_map["item"])
        item_name = cell_value(ws, merge_map, r, col_map["item"])
        item_qty = parse_qty(ws.cell(row=r, column=col_map["item_qty"]).value) if col_map.get("item_qty") else None

        resource_cell = ws.cell(row=r, column=col_map["resource"])
        resource_name = ws.cell(row=r, column=col_map["resource"]).value  # 每列各自的花費，不用 merge
        resource_qty = parse_qty(ws.cell(row=r, column=col_map["resource_qty"]).value) if col_map.get("resource_qty") else None

        if not any([region, npc, item_name, resource_name]):
            continue

        if item_name:
            item_name = str(item_name).strip()
            item_category.setdefault(item_name, lookup_category(item_cell))

        if resource_name:
            resource_name = str(resource_name).strip()
            item_category.setdefault(resource_name, lookup_category(resource_cell))

        rows.append({
            "region": str(region).strip() if region else None,
            "npc": str(npc).strip() if npc else None,
            "recommended": recommended,
            "item": item_name,
            "itemQty": item_qty,
            "resource": {"name": resource_name, "qty": resource_qty} if resource_name else None,
        })

    items = {}
    notes = []

    for row in rows:
        if row["item"] and row["resource"] and row["resource"]["name"]:
            entry = {
                "region": row["region"],
                "npc": row["npc"],
                "recommended": row["recommended"],
                "resultQty": row["itemQty"],
                "resource": row["resource"],
            }
            items.setdefault(row["item"], []).append(entry)
        elif row["npc"] and not row["item"]:
            notes.append({
                "region": row["region"],
                "npc": row["npc"],
            })

    # 去除完全重複的 recipe
    for k, v in items.items():
        seen = set()
        deduped = []
        for e in v:
            key = json.dumps(e, ensure_ascii=False, sort_keys=True)
            if key not in seen:
                seen.add(key)
                deduped.append(e)
        items[k] = deduped

    # 分類順序：依圖例出現順序，最後補上「未分類」
    category_order = []
    for r in range(1, header_row):
        label = ws.cell(row=r, column=1).value
        if label and str(label).strip() not in ("品項類型",) and str(label).strip() not in category_order:
            category_order.append(str(label).strip())
    if UNCATEGORIZED not in category_order:
        category_order.append(UNCATEGORIZED)

    output = {
        "generatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "categoryOrder": category_order,
        "itemCategory": item_category,
        "items": items,
        "notes": notes,
    }

    with open(dst, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"轉換完成：{len(items)} 種兌換物品，{len(item_category)} 個已分類名稱，{len(notes)} 筆備註 -> {dst}")


if __name__ == "__main__":
    main()
