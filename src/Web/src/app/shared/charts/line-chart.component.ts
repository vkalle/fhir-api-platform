import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface ChartSeries {
  name: string;
  short: string;
  values: number[];
}

const W = 700;
const L = 48;
const PLOT_W = 556;
const TOP = 12;
const H = 220;

/**
 * Multi-series line chart (max 3 series, colours chart-1..3 from the tokens).
 * Legend plus direct end labels, so identity never relies on colour alone.
 */
@Component({
  selector: 'app-line-chart',
  template: `
    <div class="lc__legend" aria-hidden="true">
      @for (s of series(); track s.name; let i = $index) {
        <span><i class="lc__swatch" [attr.data-series]="i + 1"></i>{{ s.name }}</span>
      }
    </div>
    <svg [attr.viewBox]="'0 0 ' + width + ' 272'" role="img" [attr.aria-label]="ariaLabel()">
      @for (g of grid(); track g.v) {
        <line class="lc__grid" [attr.x1]="left" [attr.x2]="left + plotW" [attr.y1]="g.y" [attr.y2]="g.y" />
        <text class="lc__tick" [attr.x]="left - 8" [attr.y]="g.y + 5" text-anchor="end">{{ g.label }}</text>
      }
      @for (t of xTicks(); track t.x) {
        <text class="lc__tick" [attr.x]="t.x" y="266" text-anchor="middle">{{ t.label }}</text>
      }
      @for (s of lines(); track s.name) {
        <polyline class="lc__line" [attr.data-series]="s.index" [attr.points]="s.points" />
        <text class="lc__end" [attr.x]="s.lx" [attr.y]="s.ly">{{ s.short }}</text>
      }
    </svg>
  `,
  styleUrl: './line-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineChartComponent {
  readonly series = input.required<ChartSeries[]>();
  readonly labels = input.required<string[]>();
  readonly max = input.required<number>();
  readonly ariaLabel = input('Line chart');

  protected readonly width = W;
  protected readonly left = L;
  protected readonly plotW = PLOT_W;

  private x(i: number): number {
    return L + (i * PLOT_W) / (this.labels().length - 1);
  }

  private y(v: number): number {
    return TOP + H - (v / this.max()) * H;
  }

  protected readonly grid = computed(() =>
    [0, 1, 2, 3].map((i) => {
      const v = (this.max() / 3) * i;
      return { v, y: this.y(v), label: v === 0 ? '0' : `${Math.round(v / 1000)}k` };
    }),
  );

  protected readonly xTicks = computed(() => {
    const n = this.labels().length;
    const step = n > 10 ? 7 : 1;
    const out: { x: number; label: string }[] = [];
    for (let i = 0; i < n; i += step) out.push({ x: this.x(i), label: this.labels()[i] });
    return out;
  });

  protected readonly lines = computed(() => {
    const out = this.series().map((s, i) => ({
      name: s.name,
      short: s.short,
      index: i + 1,
      points: s.values.map((v, j) => `${this.x(j).toFixed(1)},${this.y(v).toFixed(1)}`).join(' '),
      lx: this.x(s.values.length - 1) + 8,
      ly: this.y(s.values[s.values.length - 1]) + 5,
    }));
    // Keep end labels from overlapping.
    const sorted = [...out].sort((a, b) => a.ly - b.ly);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].ly - sorted[i - 1].ly < 18) sorted[i].ly = sorted[i - 1].ly + 18;
    }
    return out;
  });
}
