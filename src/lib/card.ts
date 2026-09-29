import { BASE_LABEL, Dong, GROUPS, fmt, topPercentLabel, typeCount } from "./data";
import { AXES, profileOf } from "./types";

const KR = `"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif`;
const DISPLAY = `Unbounded, "Pretendard Variable", "Arial Black", sans-serif`;

export const CARD_W = 1080;
export const CARD_H = 1350;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** mulberry32 — deterministic sparkles per dong */
function rng(seedStr: string) {
  let a = 0;
  for (let i = 0; i < seedStr.length; i++) a = (a * 31 + seedStr.charCodeAt(i)) | 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, family: string, maxW: number, min = 24) {
  let s = size;
  ctx.font = `${weight} ${s}px ${family}`;
  while (ctx.measureText(text).width > maxW && s > min) {
    s -= 4;
    ctx.font = `${weight} ${s}px ${family}`;
  }
  return s;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(next).width <= maxW) cur = next;
    else {
      if (cur) lines.push(cur);
      cur = w;
    }
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  return lines.slice(0, maxLines);
}

async function ensureFonts(sample: string) {
  if (!("fonts" in document)) return;
  const specs = [
    `900 100px "Pretendard Variable"`,
    `700 40px "Pretendard Variable"`,
    `500 40px "Pretendard Variable"`,
    `900 100px Unbounded`,
  ];
  const timeout = new Promise((r) => setTimeout(r, 2500));
  try {
    await Promise.race([Promise.all(specs.map((s) => document.fonts.load(s, sample))), timeout]);
  } catch {
    /* offline: fall back to system fonts */
  }
}

/** Draws the shareable "동네 포토카드" (1080×1350) and returns a PNG blob. */
export async function renderCardPng(d: Dong): Promise<Blob> {
  const p = profileOf(d.type);
  const [c1, c2, c3] = p.colors;
  const sample = `${d.sidoShort}${d.sigungu}${d.name}${p.nick}${p.tagline}동네MBTI가게곳분석전국위상위기준#우리동네${d.type}0123456789%`;
  await ensureFonts(sample);

  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;
  const rand = rng(d.code);

  // ---- background ---------------------------------------------------------
  const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  bg.addColorStop(0, c1);
  bg.addColorStop(0.55, c2);
  bg.addColorStop(1, c1);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  const blob1 = ctx.createRadialGradient(880, 180, 20, 880, 180, 620);
  blob1.addColorStop(0, c3 + "cc");
  blob1.addColorStop(1, c3 + "00");
  ctx.fillStyle = blob1;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  const blob2 = ctx.createRadialGradient(120, 1150, 10, 120, 1150, 700);
  blob2.addColorStop(0, "#ffffff55");
  blob2.addColorStop(1, "#ffffff00");
  ctx.fillStyle = blob2;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // holographic diagonal sheen
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  const holo = ctx.createLinearGradient(0, 0, CARD_W, CARD_H * 0.9);
  ["#ff00cc", "#00e5ff", "#fff200", "#00ff9d", "#b100ff", "#ff6a00"].forEach((c, i, arr) =>
    holo.addColorStop(i / (arr.length - 1), c + "55"),
  );
  ctx.fillStyle = holo;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.restore();

  // readability vignette
  const vig = ctx.createLinearGradient(0, 0, 0, CARD_H);
  vig.addColorStop(0, "rgba(10,10,25,0.10)");
  vig.addColorStop(0.55, "rgba(10,10,25,0.05)");
  vig.addColorStop(1, "rgba(10,10,25,0.55)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // sparkles
  for (let i = 0; i < 90; i++) {
    const x = rand() * CARD_W;
    const y = rand() * CARD_H;
    const r = rand() * 2.6 + 0.6;
    ctx.fillStyle = `rgba(255,255,255,${0.25 + rand() * 0.6})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // big 4-point stars only in the empty area right of the dong name
  for (let i = 0; i < 5; i++) {
    const x = 600 + rand() * 380;
    const y = 170 + rand() * 160;
    const s = 10 + rand() * 18;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(0, 0, s, 0);
    ctx.quadraticCurveTo(0, 0, 0, s);
    ctx.quadraticCurveTo(0, 0, -s, 0);
    ctx.quadraticCurveTo(0, 0, 0, -s);
    ctx.fill();
    ctx.restore();
  }

  // photocard frame
  ctx.save();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  roundRect(ctx, 36, 36, CARD_W - 72, CARD_H - 72, 56);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#fff";
  ctx.textBaseline = "alphabetic";

  // ---- header ---------------------------------------------------------------
  ctx.font = `800 34px ${KR}`;
  const pill = "🏘️ 우리 동네 MBTI";
  const pw = ctx.measureText(pill).width + 56;
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  roundRect(ctx, 88, 82, pw, 64, 32);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillText(pill, 116, 126);

  ctx.font = `600 30px ${KR}`;
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(`${BASE_LABEL} 상가 데이터 기준`, CARD_W - 92, 124);
  ctx.textAlign = "left";

  // ---- location ---------------------------------------------------------
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = `700 44px ${KR}`;
  ctx.fillText(`${d.sidoShort} ${d.sigungu}`, 92, 236);

  fitFont(ctx, d.name, 900, 112, KR, CARD_W - 184, 56);
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 24;
  ctx.fillText(d.name, 88, 350);

  // ---- MBTI letters -------------------------------------------------------
  const letterSize = fitFont(ctx, d.type, 900, 280, DISPLAY, CARD_W - 170, 120);
  ctx.shadowColor = "rgba(0,0,0,0.30)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(d.type, 80, 360 + letterSize * 0.86);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // ---- nickname & tagline -------------------------------------------------
  let y = 360 + letterSize * 0.86 + 100;
  fitFont(ctx, `${p.emoji} ${p.nick}`, 900, 68, KR, CARD_W - 184, 40);
  ctx.fillStyle = "#fff";
  ctx.fillText(`${p.emoji} ${p.nick}`, 92, y);

  y += 70;
  ctx.font = `600 38px ${KR}`;
  ctx.fillStyle = "rgba(255,255,255,0.93)";
  for (const line of wrapLines(ctx, `“${p.tagline}”`, CARD_W - 184, 2)) {
    ctx.fillText(line, 92, y);
    y += 52;
  }

  // ---- axis mini bars ------------------------------------------------------
  y += 22;
  const barX = 190;
  const barW = CARD_W - 190 - 260;
  AXES.forEach((ax, j) => {
    const pct = d.axes[j];
    const winFirst = pct >= 50;
    const rowY = y + j * 52;
    ctx.font = `900 38px ${DISPLAY}`;
    ctx.fillStyle = winFirst ? "#fff" : "rgba(255,255,255,0.45)";
    ctx.fillText(ax.first, 100, rowY + 14);
    ctx.fillStyle = !winFirst ? "#fff" : "rgba(255,255,255,0.45)";
    ctx.fillText(ax.second, barX + barW + 22, rowY + 14);
    // track
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    roundRect(ctx, barX, rowY - 10, barW, 22, 11);
    ctx.fill();
    // fill toward winner
    const winPct = winFirst ? pct : 100 - pct;
    const fw = (barW * winPct) / 100;
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    roundRect(ctx, winFirst ? barX : barX + barW - fw, rowY - 10, fw, 22, 11);
    ctx.fill();
    ctx.font = `800 32px ${KR}`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "right";
    ctx.fillText(`${winPct}%`, CARD_W - 92, rowY + 12);
    ctx.textAlign = "left";
  });
  y += 4 * 52 + 16;

  // ---- badges -----------------------------------------------------------
  const badges = d.top.slice(0, 3).map((gi) => `${GROUPS[gi].emoji} ${GROUPS[gi].label} ${topPercentLabel(d.pct[gi])}`);
  let bx = 92;
  let fs = 32;
  ctx.font = `800 ${fs}px ${KR}`;
  const totalW = () => badges.reduce((s, b) => s + ctx.measureText(b).width + 52 + 14, -14);
  while (totalW() > CARD_W - 184 && fs > 22) {
    fs -= 2;
    ctx.font = `800 ${fs}px ${KR}`;
  }
  for (const b of badges) {
    const w = ctx.measureText(b).width + 52;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    roundRect(ctx, bx, y, w, fs + 34, (fs + 34) / 2);
    ctx.fill();
    ctx.fillStyle = "#15122b";
    ctx.fillText(b, bx + 26, y + fs + 9);
    bx += w + 14;
  }

  // ---- footer -------------------------------------------------------------
  ctx.font = `700 30px ${KR}`;
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  const rankText = d.rank > 0 ? ` · 전국 ${d.type} 동네 ${fmt(typeCount(d.type))}곳 중 ${fmt(d.rank)}위` : "";
  fitFont(ctx, `가게 ${fmt(d.total)}곳 분석${rankText}`, 700, 30, KR, CARD_W - 184 - 250, 20);
  ctx.fillText(`가게 ${fmt(d.total)}곳 분석${rankText}`, 92, CARD_H - 92);
  ctx.textAlign = "right";
  ctx.font = `900 32px ${KR}`;
  ctx.fillText("#우리동네MBTI", CARD_W - 92, CARD_H - 92);
  ctx.textAlign = "left";

  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG 생성 실패"))), "image/png"),
  );
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
