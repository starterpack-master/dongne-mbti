"""Build the compact 동네 MBTI dataset for the web app.

Input : agg.json produced by aggregate.py (per-행정동 소분류 counts)
Output: src/data/dongs.json (compact arrays consumed by the front-end)

Method (for fun, but reproducible):
  1. For every 행정동 and every 소분류, compute a shrunk location quotient
        s = (n + K * p) / (T + K),  LQ = s / p
     where p is the nationwide share of that 소분류 and T the dong's store count.
     Shrinkage (K) keeps tiny dongs from swinging wildly.
  2. Each MBTI axis = weighted mean of ln(LQ) over its "first letter" categories
     minus the same over its "second letter" categories.
  3. Axes are robust-standardized (median / MAD), then ZCA-whitened so the four
     axes are uncorrelated (otherwise downtown dongs all collapse into one type),
     then re-standardized. Sign -> letter, normal CDF -> percentage.
"""
import json
import math
import statistics
import sys
from collections import Counter

import numpy as np

K = 40.0  # shrinkage strength (in "virtual stores")

# ----------------------------------------------------------------------------
# MBTI axes: (first letter, second letter) -> {소분류코드: weight}
# ----------------------------------------------------------------------------
AXES = {
    "EI": {
        # E: 밖에서 모이고 마시는 동네
        "E": {
            "I21104": 1.5, "I21103": 1.3, "I21102": 0.6,  # 요리주점, 호프, 클럽 (접객 유흥주점 제외)
            "R10407": 1.2,  # 노래방
            "I20107": 1.0, "I20109": 1.0, "I20108": 0.8, "I20110": 0.8, "I20112": 0.8,  # 고기·회식
            "I20111": 0.8,  # 횟집
            "I20702": 0.5, "I20403": 0.5,  # 뷔페, 패밀리레스토랑
            "R10310": 0.8, "R10309": 0.6, "R10311": 0.6,  # 당구, 볼링, 골프연습장
        },
        # I: 집·혼자·배달의 동네
        "I": {
            "G20405": 1.2,  # 편의점
            "S20902": 1.2,  # 셀프 빨래방
            "G20509": 1.0,  # 반찬가게
            "R10202": 1.0,  # 독서실/스터디카페
            "I10201": 1.0,  # 기숙사/고시원
            "I21007": 0.8,  # 김밥/분식
            "I21003": 0.8, "I20103": 0.8, "I21006": 0.6, "I21004": 0.5,  # 배달 야식
            "N11003": 0.6,  # 만화방
            "G22001": 0.8,  # 애완용품
            "G21301": 0.6,  # 서점
        },
    },
    "SN": {
        # S: 시장·생활 밀착 현실파 동네
        "S": {
            "I20101": 1.0, "I20102": 1.0, "I20105": 0.8, "I20106": 0.6, "I21002": 0.8,
            "I20201": 0.6,  # 동네 중국집
            "G20503": 1.0, "G20506": 1.0, "G20505": 0.8, "G20504": 0.8, "G20404": 0.8,
            "G21001": 1.0,  # 철물점
            "S20301": 0.8, "S20501": 0.8, "S20601": 0.6, "S20901": 0.8,
            "S20801": 1.0,  # 목욕탕
            "G21401": 0.6, "G21403": 0.5,
            "L10203": 0.6,  # 부동산
        },
        # N: 카페·빵·소품·이국 음식의 감성 트렌디 동네
        "N": {
            "I21201": 1.5, "I21001": 1.0, "I21008": 0.6,
            "G21901": 1.0, "M11301": 1.0, "G21801": 0.8, "G21802": 0.8,
            "G20907": 1.0, "G20902": 0.8, "G20905": 0.6, "G22201": 0.5, "N11004": 0.4,
            "I20401": 0.8, "I20402": 1.0, "I20499": 0.8,
            "I20302": 0.8, "I20303": 0.8, "I20501": 0.8, "I20599": 0.8, "I20202": 0.8,
            "I21005": 0.8,
            "M11203": 0.6, "M11202": 0.5, "M11204": 0.6,
            "G21203": 0.5, "G21303": 0.5,
        },
    },
    "TF": {
        # T: 일·공부·자기관리 갓생 동네
        "T": {
            "M10703": 1.0, "M10402": 0.8, "M10401": 0.8, "M10301": 0.8, "M10303": 0.6,
            "M10302": 0.6, "M10307": 0.6, "M10501": 0.8, "M10901": 0.6, "M10999": 0.6,
            "M10903": 0.5, "M10601": 0.6, "M11502": 0.5, "N10401": 0.5, "N10703": 0.6,
            "I20701": 0.8,  # 구내식당
            "P10615": 0.6, "P10617": 0.8, "P10627": 0.5, "P10625": 0.5,
            "R10307": 0.8,  # 헬스장
            "G20801": 0.5, "G21601": 0.5,
        },
        # F: 뷰티·반려·케어 힐링 동네
        "F": {
            "S20701": 1.0, "S20702": 1.0, "S20703": 1.0, "S20803": 0.8, "S20802": 0.6,
            "P10603": 1.2,  # 요가/필라테스
            "M11101": 1.0,  # 동물병원
            "G21503": 0.6, "G20903": 0.6, "G21306": 0.6, "G20508": 0.5,
            "S21105": 0.4, "S21101": 0.4,
        },
    },
    "JP": {
        # J: 학원·병원 루틴이 꽉 찬 계획형 동네
        "J": {
            "P10501": 1.2, "P10601": 0.8, "P10609": 0.8, "P10611": 0.8, "P10613": 0.6,
            "P10701": 0.6, "P10799": 0.5,
            "Q10201": 1.0, "Q10210": 0.8, "Q10211": 0.8, "Q10206": 0.8, "Q10205": 0.6,
            "Q10204": 0.5, "Q10202": 0.5,
            "G21501": 0.8, "G21302": 0.6, "R10312": 0.4, "P10623": 0.3,
        },
        # P: 놀거리·여행·레저가 넘치는 즉흥형 동네
        "P": {
            "R10406": 1.0, "R10404": 1.0, "R10405": 1.0, "R10499": 0.8, "R10410": 0.6,
            "I10103": 1.0, "I10104": 1.0, "I10101": 0.8,  # 모텔은 제외
            "R10409": 1.0, "R10408": 0.6,
            "N10501": 0.5, "N10599": 0.5, "N11001": 0.8, "N10901": 0.8, "G21305": 0.4,
        },
    },
}

# ----------------------------------------------------------------------------
# Display groups for the "동네 성분표", badges and battle mode
# ----------------------------------------------------------------------------
GROUPS = [
    ("cafe", "☕", "카페", ["I21201"]),
    ("dessert", "🥐", "빵·디저트", ["I21001", "I21008", "I21002"]),
    ("bar", "🍺", "술집", ["I21104", "I21103", "I21102"]),
    ("meat", "🥩", "고기·회식", ["I20107", "I20108", "I20109", "I20110", "I20112", "I20111"]),
    ("rice", "🍚", "한식 밥집", ["I20101", "I20102", "I20105", "I20106", "I20104", "I20113", "I20199", "I21007"]),
    ("global", "🍝", "세계 음식", ["I20401", "I20402", "I20403", "I20499", "I20301", "I20302", "I20303",
                                  "I20399", "I20501", "I20599", "I20601", "I20202", "I21005"]),
    ("delivery", "🍗", "치킨·야식", ["I21006", "I21003", "I20103", "I21004", "I20201"]),
    ("conv", "🏪", "편의점", ["G20405"]),
    ("market", "🛒", "장보기", ["G20404", "G20503", "G20506", "G20505", "G20504", "G20509", "G20501"]),
    ("beauty", "💅", "뷰티", ["S20701", "S20702", "S20703", "S20803", "S20802", "G21503"]),
    ("fitness", "🏋️", "운동", ["R10307", "P10603", "R10311", "R10312", "R10313", "R10308", "R10306",
                               "R10316", "R10314", "G21304"]),
    ("play", "🎮", "놀거리", ["R10407", "R10406", "R10310", "R10309", "R10404", "R10405", "R10499",
                             "N11003", "R10402", "R10414"]),
    ("study", "📚", "학원·공부", ["P10501", "P10615", "P10617", "P10609", "P10611", "P10601", "P10613",
                                "P10627", "P10625", "R10202", "G21301", "P10701"]),
    ("clinic", "🏥", "병원·약국", ["Q10201", "Q10202", "Q10203", "Q10204", "Q10205", "Q10206", "Q10207",
                                 "Q10208", "Q10209", "Q10210", "Q10211", "Q10212", "Q10101", "Q10102",
                                 "Q10103", "Q10104", "Q10105", "G21501"]),
    ("pet", "🐶", "반려동물", ["M11101", "G22001"]),
    ("office", "💼", "오피스", ["M10703", "M10402", "M10401", "M10301", "M10303", "M10302", "M10307",
                               "M10306", "M10501", "M10901", "M10999", "M10903", "M10601", "M11502",
                               "M11203", "M11201", "M11202", "M11204", "M10504", "M11401"]),
    ("travel", "🧳", "여행·숙박", ["I10103", "I10104", "I10101", "N10501", "N10599", "R10409",
                                 "R10408"]),
    ("vibe", "🌸", "감성 소품", ["G21901", "M11301", "G21801", "G21802", "G20907", "G20902", "G20905",
                                "G22201", "G21203", "G21303"]),
    ("realty", "🏠", "부동산", ["L10203"]),
    ("life", "🧺", "세탁·수리", ["S20901", "S20902", "S20601", "S20501", "G21001", "S20801"]),
]

MIN_TOTAL_FOR_RANK = 30

# Friendlier names for a few 소분류 labels shown in the UI
DISPLAY_NAME = {
    "I21104": "요리주점", "I21103": "호프·생맥주", "I21102": "클럽·나이트",
    "I10103": "펜션·게스트하우스", "I10104": "캠핑·글램핑", "I10101": "호텔·리조트",
    "R10405": "오락실·방탈출 등", "R10499": "기타 놀거리", "R10404": "게임장",
    "M11301": "사진관·셀프사진", "G22201": "빈티지·중고샵", "N10599": "여행 예약 서비스",
    "N10901": "렌터카", "I10201": "고시원·기숙사", "G20509": "반찬가게", "S20902": "코인빨래방",
    "R10202": "독서실·스터디카페", "G22001": "펫샵·반려용품", "M11101": "동물병원",
    "P10501": "입시·보습학원", "P10603": "요가·필라테스", "I21007": "김밥·분식",
    "I20107": "삼겹살·돼지고기", "I20109": "곱창", "I20108": "소고기", "I20110": "닭·오리 요리",
    "I20112": "조개·해산물 구이", "I20402": "파스타·스테이크", "I20401": "경양식",
    "I20499": "기타 양식", "I21005": "샌드위치·샐러드", "I21008": "아이스크림·빙수",
    "G20907": "액세서리·잡화", "G21802": "기념품샵", "G21801": "갤러리·예술품",
    "M10703": "경영 컨설팅", "M10501": "광고 대행사", "N10703": "복사·인쇄",
    "I20701": "구내식당", "N11001": "레저용품 대여", "N11003": "만화카페",
    "R10410": "복권방", "R10409": "수상·해양 레저", "R10408": "낚시터",
}  # dongs with fewer stores are shown but excluded from rankings


def phi(x: float) -> float:
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))


def robust_standardize(v: np.ndarray) -> np.ndarray:
    med = np.median(v)
    mad = np.median(np.abs(v - med)) * 1.4826
    return (v - med) / (mad if mad > 1e-9 else 1.0)


def main(agg_path: str, out_path: str) -> None:
    agg = json.load(open(agg_path, encoding="utf-8"))
    cats = agg["categories"]
    dongs = agg["dongs"]
    national_total = sum(c["count"] for c in cats.values())
    p = {code: c["count"] / national_total for code, c in cats.items()}

    codes = sorted(dongs.keys())
    n = len(codes)

    # ---- raw axis scores ---------------------------------------------------
    raw = np.zeros((n, 4))
    for i, dcode in enumerate(codes):
        d = dongs[dcode]
        T = d["total"]
        counts = d["counts"]

        def mean_log_lq(weights: dict) -> float:
            num, den = 0.0, 0.0
            for code, w in weights.items():
                if code not in p:
                    continue
                s = (counts.get(code, 0) + K * p[code]) / (T + K)
                num += w * math.log(s / p[code])
                den += w
            return num / den if den else 0.0

        for j, (axis, sides) in enumerate(AXES.items()):
            first, second = list(sides.keys())
            raw[i, j] = mean_log_lq(sides[first]) - mean_log_lq(sides[second])

    z = np.column_stack([robust_standardize(raw[:, j]) for j in range(4)])

    # ---- decorrelate (ZCA whitening), weighted toward dongs with enough stores
    totals = np.array([dongs[c]["total"] for c in codes], dtype=float)
    w = np.sqrt(np.minimum(totals, 2000.0))
    w = w / w.sum()
    mu = (z * w[:, None]).sum(axis=0)
    zc = z - mu
    cov = (zc * w[:, None]).T @ zc
    evals, evecs = np.linalg.eigh(cov)
    zca = evecs @ np.diag(1.0 / np.sqrt(np.maximum(evals, 1e-9))) @ evecs.T
    zw = zc @ zca
    zw = np.column_stack([robust_standardize(zw[:, j]) for j in range(4)])

    corr_before = np.corrcoef(z.T)
    corr_after = np.corrcoef(zw.T)

    letters = [("E", "I"), ("S", "N"), ("T", "F"), ("J", "P")]
    # NOTE: axis 2 is S(+) vs N(-), but MBTI order is "S/N" so keep as is.

    types = []
    for i in range(n):
        t = "".join(a if zw[i, j] > 0 else b for j, (a, b) in enumerate(letters))
        types.append(t)

    # ---- display groups ----------------------------------------------------
    group_nat_share = []
    for key, emoji, label, members in GROUPS:
        g = sum(cats[m]["count"] for m in members if m in cats)
        group_nat_share.append(g / national_total)

    group_counts = np.zeros((n, len(GROUPS)), dtype=int)
    for i, dcode in enumerate(codes):
        counts = dongs[dcode]["counts"]
        for gi, (_, _, _, members) in enumerate(GROUPS):
            group_counts[i, gi] = sum(counts.get(m, 0) for m in members)

    shares = group_counts / np.maximum(totals[:, None], 1)
    eligible = totals >= MIN_TOTAL_FOR_RANK
    # percentile of share among eligible dongs (0 = lowest, 100 = highest)
    pct = np.zeros_like(shares)
    for gi in range(len(GROUPS)):
        ref = np.sort(shares[eligible, gi])
        pct[:, gi] = np.searchsorted(ref, shares[:, gi], side="right") / len(ref) * 100.0

    # ---- top features per dong: most over-represented groups ---------------
    top_features = []
    for i in range(n):
        T = totals[i]
        cands = []
        for gi in range(len(GROUPS)):
            c = group_counts[i, gi]
            if c < 3:
                continue
            s = (c + K * group_nat_share[gi]) / (T + K)
            lq = s / group_nat_share[gi]
            cands.append((lq, gi))
        cands.sort(reverse=True)
        top = [gi for _, gi in cands[:3]]
        top_features.append(top)

    # ---- type rank (how "typical" this dong is for its type) ---------------
    strength = np.abs(zw).sum(axis=1)
    rank = [0] * n
    type_count = Counter()
    by_type: dict = {}
    for i in range(n):
        if eligible[i]:
            by_type.setdefault(types[i], []).append(i)
    for t, idxs in by_type.items():
        idxs.sort(key=lambda k: -strength[k])
        type_count[t] = len(idxs)
        for r, k in enumerate(idxs, start=1):
            rank[k] = r

    # ---- evidence: which categories pushed each axis toward its letter --------
    used_codes = set()
    evidence_all = []
    for i, dcode in enumerate(codes):
        d = dongs[dcode]
        T = d["total"]
        counts = d["counts"]
        ev_dong = []
        for j, (axis, sides) in enumerate(AXES.items()):
            first, second = list(sides.keys())
            toward_first = zw[i, j] > 0
            win_letter = first if toward_first else second
            lose_letter = second if toward_first else first
            # 1) prefer "this kind of store is unusually common here"
            over = []
            for code, wgt in sides[win_letter].items():
                if code not in p:
                    continue
                cnt = counts.get(code, 0)
                raw_lq = (cnt / T) / p[code] if T else 0.0
                if cnt < 3 or raw_lq < 1.15:
                    continue
                s = (cnt + K * p[code]) / (T + K)
                over.append((wgt * math.log(s / p[code]), code, cnt, raw_lq))
            over.sort(reverse=True)
            picked = [[code, cnt, int(round(lq * 10)), 1] for _, code, cnt, lq in over[:2]]
            # 2) otherwise fall back to "the opposite kind of store is rare here"
            if len(picked) < 2:
                under = []
                for code, wgt in sides[lose_letter].items():
                    if code not in p or p[code] < 0.003:
                        continue
                    cnt = counts.get(code, 0)
                    raw_lq = (cnt / T) / p[code] if T else 0.0
                    if raw_lq > 0.8:
                        continue
                    s = (cnt + K * p[code]) / (T + K)
                    under.append((-wgt * math.log(s / p[code]), code, cnt, raw_lq))
                under.sort(reverse=True)
                for _, code, cnt, lq in under[: 2 - len(picked)]:
                    picked.append([code, cnt, int(round(lq * 10)), 0])
            for item in picked:
                used_codes.add(item[0])
            ev_dong.append(picked)
        evidence_all.append(ev_dong)

    # ---- output --------------------------------------------------------------
    cat_list = sorted(used_codes)
    cat_index = {c: k for k, c in enumerate(cat_list)}
    sigungu_list = []
    sigungu_index = {}
    for dcode in codes:
        key = (dongs[dcode]["sido"], dongs[dcode]["sigungu"])
        if key not in sigungu_index:
            sigungu_index[key] = len(sigungu_list)
            sigungu_list.append(list(key))

    out_dongs = []
    for i, dcode in enumerate(codes):
        d = dongs[dcode]
        # soft-compress to 3..97 so nothing reads as a silly "0%" / "100%"
        axes_pct = [int(round(50 + 47 * math.tanh(float(zw[i, j]) / 2.0))) for j in range(4)]
        out_dongs.append([
            dcode,
            sigungu_index[(d["sido"], d["sigungu"])],
            d["dong"],
            int(d["total"]),
            round(d["lat"], 4) if d["lat"] is not None else None,
            round(d["lon"], 4) if d["lon"] is not None else None,
            types[i],
            axes_pct,  # % of the FIRST letter on each axis (E, S, T, J)
            [int(x) for x in group_counts[i]],
            [int(round(x)) for x in pct[i]],  # share percentile per group
            top_features[i],
            rank[i],  # 0 = not ranked (too few stores)
            # per axis: [[category index, 개수, 전국 대비 배수x10, 1=많음/0=적음], ...]
            [[[cat_index[c], cnt, lq, over] for c, cnt, lq, over in ev] for ev in evidence_all[i]],
        ])

    result = {
        "base": agg["baseMonth"],
        "totalStores": national_total,
        "minTotalForRank": MIN_TOTAL_FOR_RANK,
        "groups": [[k, e, l] for k, e, l, _ in GROUPS],
        "groupNatShare": [round(x, 6) for x in group_nat_share],
        "categories": [DISPLAY_NAME.get(c, cats[c]["name"]) for c in cat_list],
        "sigungus": sigungu_list,
        "typeCount": dict(type_count),
        "dongs": out_dongs,
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, separators=(",", ":"))

    # ---- diagnostics -----------------------------------------------------------
    print("corr before:\n", np.round(corr_before, 2), file=sys.stderr)
    print("corr after:\n", np.round(corr_after, 2), file=sys.stderr)
    tc = Counter(t for t, e in zip(types, eligible) if e)
    print("type distribution (eligible):", file=sys.stderr)
    for t, c in tc.most_common():
        print(f"  {t}: {c} ({c / eligible.sum() * 100:.1f}%)", file=sys.stderr)
    for j, (a, b) in enumerate(letters):
        share_first = (zw[eligible, j] > 0).mean() * 100
        print(f"  axis {a}/{b}: {share_first:.1f}% {a}", file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
