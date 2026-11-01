export function formatTroops(value: bigint): string {
  if (value < 0n) return '0';
  if (value < 10000n) return value.toLocaleString('ja-JP');
  const units: Array<[bigint, string]> = [
    [10n**16n, '京'], [10n**12n, '兆'], [10n**8n, '億'], [10n**4n, '万'],
  ];
  if (value.toString().length > 35) return `10^${value.toString().length-1}`;
  for (const [base, label] of units) {
    if (value >= base) {
      const integer = value / base;
      const oneDecimal = (value % base)*10n/base;
      return integer < 100n && oneDecimal>0n ? `${integer}.${oneDecimal}${label}` : `${integer}${label}`;
    }
  }
  return value.toLocaleString('ja-JP');
}
export function formatTime(seconds:number):string {
  const t=Math.max(0,Math.floor(seconds));
  return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
}
export function approximateTroopLog10(value:bigint):number {
  if(value<=0n) return 0;
  const s=value.toString();
  return s.length-1+Math.log10(Number(s.slice(0,Math.min(6,s.length)))/Math.pow(10,Math.min(6,s.length)-1));
}
