/** Picks the Korean particle that fits the last syllable: `josa("연남동", "과", "와")` → "과". */
export function josa(word: string, afterBatchim: string, afterVowel: string): string {
  const ch = word.charCodeAt(word.length - 1);
  if (ch >= 0xac00 && ch <= 0xd7a3) return (ch - 0xac00) % 28 === 0 ? afterVowel : afterBatchim;
  return afterVowel;
}
