// Deterministic sample metrics for the prototype. Replace with API calls.

export interface HourlyOps {
  volume: number[];
  p95: number[];
  failedPct: number[];
}

/** 24 hourly points ending now (11:00 yesterday → 10:00 today). */
export function hourlyOps(scale: number, incidentAt = -1): HourlyOps {
  const volume: number[] = [];
  const p95: number[] = [];
  const failedPct: number[] = [];
  for (let i = 0; i < 24; i++) {
    const hr = (11 + i) % 24;
    const biz = hr >= 7 && hr <= 19 ? 1 : 0.3;
    volume.push(Math.round((95 + 40 * Math.sin(((hr - 7) / 12) * Math.PI)) * biz * 1000 * scale + 6000 * Math.cos(i)));
    p95.push(Math.round(250 + 60 * biz + 25 * Math.sin(i * 1.1) + (i === incidentAt ? 140 : 0)));
    failedPct.push(+(0.55 + 0.15 * Math.sin(i / 2) + (i >= incidentAt && incidentAt >= 0 ? 1.4 : 0)).toFixed(2));
  }
  return { volume, p95, failedPct };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 30 daily points by domain for one Account (Aug 29 → Sep 27, 2026). */
export function dailyByDomain(): { labels: string[]; cm: number[]; um: number[]; ag: number[] } {
  const labels: string[] = [];
  const cm: number[] = [];
  const um: number[] = [];
  const ag: number[] = [];
  const start = new Date(2026, 7, 29);
  for (let i = 0; i < 30; i++) {
    const d = new Date(start.getTime() + i * 86_400_000);
    const weekend = d.getDay() === 0 || d.getDay() === 6 ? 0.55 : 1;
    const trend = 1 + i * 0.006;
    const noise = (k: number) => 1 + 0.08 * Math.sin(i * 1.7 + k) + 0.05 * Math.cos(i * 0.9 + k * 2);
    cm.push(Math.round(34000 * weekend * trend * noise(1)));
    um.push(Math.round(22000 * weekend * trend * noise(2)));
    ag.push(Math.round(8500 * weekend * trend * noise(3)));
    labels.push(`${MONTHS[d.getMonth()]} ${d.getDate()}`);
  }
  return { labels, cm, um, ag };
}

export function compact(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  return String(v);
}
