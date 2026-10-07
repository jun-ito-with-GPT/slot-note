export type Entry = { id: string; played_on: string; store: string; machine: string; investment: number; returned: number; memo: string };
export type EntryInput = Omit<Entry, 'id'>;
export const MAX_AMOUNT = 100_000_000;
export function localDate(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function profit(entry: Pick<Entry, 'investment' | 'returned'>) { return entry.returned - entry.investment; }
export function monthlySummary(entries: Entry[], month: string) {
  const records = entries.filter(e => e.played_on.startsWith(`${month}-`));
  return { records: records.sort((a,b) => b.played_on.localeCompare(a.played_on)), investment: records.reduce((n,e)=>n+e.investment,0), returned: records.reduce((n,e)=>n+e.returned,0), profit: records.reduce((n,e)=>n+profit(e),0) };
}
export function validateEntry(entry: EntryInput): string | null {
  const date = new Date(`${entry.played_on}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.played_on) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== entry.played_on) return '日付を確認してください。';
  if (!entry.store.trim() || !entry.machine.trim()) return '店舗名と機種名を入力してください。';
  if (entry.store.length > 100 || entry.machine.length > 100 || entry.memo.length > 2000) return '店舗・機種は100文字、メモは2000文字以内で入力してください。';
  if (![entry.investment,entry.returned].every(n => Number.isSafeInteger(n) && n >= 0 && n <= MAX_AMOUNT)) return '金額は0〜100,000,000円の整数で入力してください。';
  return null;
}
