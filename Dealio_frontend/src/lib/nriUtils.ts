import { currencyRates, currencySymbols } from '../data/nriData';

export function convertINR(inrAmount: number, currency: string): number {
  return inrAmount * (currencyRates[currency] || 1);
}

export function formatDualPrice(inrAmount: number, currency: string): string {
  const inrStr = inrAmount >= 10000000
    ? `₹${(inrAmount / 10000000).toFixed(2)}Cr`
    : inrAmount >= 100000
    ? `₹${(inrAmount / 100000).toFixed(1)}L`
    : `₹${inrAmount.toLocaleString('en-IN')}`;

  if (currency === 'INR') return inrStr;

  const converted = convertINR(inrAmount, currency);
  const sym = currencySymbols[currency] || '';
  const fgnStr = converted >= 100000
    ? `${sym}${(converted / 100000).toFixed(2)}L`
    : `${sym}${Math.round(converted).toLocaleString()}`;
  return `${inrStr} (${fgnStr})`;
}

export function convertToIST(localHour: number, localOffset: number): string {
  const utcHour = localHour - localOffset;
  const istHour = ((utcHour + 5.5) + 24) % 24;
  const h = Math.floor(istHour);
  const m = istHour % 1 === 0.5 ? '30' : '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${m} ${ampm} IST`;
}

export function showDualTime(istTime: string, timezone: string, offset: number): string {
  const parts = istTime.split(' ');
  const ampm = parts[1] || 'AM';
  const [hours, mins] = (parts[0] || '12:00').split(':').map(Number);
  let h24 = hours + (ampm === 'PM' && hours !== 12 ? 12 : 0) + (ampm === 'AM' && hours === 12 ? -12 : 0);
  let localH = ((h24 - 5.5 + offset) + 48) % 24;
  const lh = Math.floor(localH);
  const lm = localH % 1 === 0.5 ? '30' : `${mins || '00'}`.padStart(2, '0');
  const la = lh >= 12 ? 'PM' : 'AM';
  const lh12 = lh > 12 ? lh - 12 : lh === 0 ? 12 : lh;
  return `${istTime} IST / ${lh12}:${lm} ${la} ${timezone}`;
}

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
