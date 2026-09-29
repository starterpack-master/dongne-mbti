"""Aggregate the 소상공인시장진흥공단 상가(상권)정보 CSVs into per-행정동 category counts.

Usage: python3 aggregate.py <path/to/sangga.zip> <out.json>

Output JSON:
{
  "baseMonth": "202606",
  "categories": {code: {"name": 소분류명, "mid": 중분류명, "big": 대분류명, "count": n}},
  "dongs": {행정동코드: {"sido": ..., "sigungu": ..., "dong": ..., "total": n,
                          "counts": {소분류코드: n}, "lon": 평균경도, "lat": 평균위도}}
}
"""
import csv
import io
import json
import re
import sys
import zipfile
from collections import Counter, defaultdict


def decode_name(info: zipfile.ZipInfo) -> str:
    if info.flag_bits & 0x800:
        return info.filename
    return info.filename.encode("cp437").decode("cp949", "ignore")


def main(zip_path: str, out_path: str) -> None:
    z = zipfile.ZipFile(zip_path)
    categories: dict = {}
    cat_count: Counter = Counter()
    dongs: dict = {}
    dong_counts: dict = defaultdict(Counter)
    dong_coord: dict = defaultdict(lambda: [0.0, 0.0, 0])
    base_month = ""

    for info in z.infolist():
        name = decode_name(info)
        if not name.endswith(".csv"):
            continue
        m = re.search(r"_(\d{6})\.csv$", name)
        if m:
            base_month = m.group(1)
        rows = 0
        with z.open(info) as f:
            reader = csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig", newline=""))
            for row in reader:
                code = row["상권업종소분류코드"]
                dcode = row["행정동코드"]
                if not code or not dcode:
                    continue
                if code not in categories:
                    categories[code] = {
                        "name": row["상권업종소분류명"],
                        "mid": row["상권업종중분류명"],
                        "big": row["상권업종대분류명"],
                    }
                cat_count[code] += 1
                if dcode not in dongs:
                    dongs[dcode] = {
                        "sido": row["시도명"],
                        "sigungu": row["시군구명"],
                        "dong": row["행정동명"],
                    }
                dong_counts[dcode][code] += 1
                try:
                    lon = float(row["경도"])
                    lat = float(row["위도"])
                    c = dong_coord[dcode]
                    c[0] += lon
                    c[1] += lat
                    c[2] += 1
                except (TypeError, ValueError):
                    pass
                rows += 1
        print(f"{name}: {rows:,} rows", file=sys.stderr)

    for code, meta in categories.items():
        meta["count"] = cat_count[code]
    out_dongs = {}
    for dcode, meta in dongs.items():
        counts = dong_counts[dcode]
        c = dong_coord[dcode]
        out_dongs[dcode] = {
            **meta,
            "total": sum(counts.values()),
            "counts": dict(counts),
            "lon": round(c[0] / c[2], 5) if c[2] else None,
            "lat": round(c[1] / c[2], 5) if c[2] else None,
        }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(
            {"baseMonth": base_month, "categories": categories, "dongs": out_dongs},
            f,
            ensure_ascii=False,
        )
    print(f"categories={len(categories)} dongs={len(out_dongs)} base={base_month}", file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
