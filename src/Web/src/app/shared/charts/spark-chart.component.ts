import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const W = 232;
const TOP = 6;
const H = 90;
const BASE = TOP + H;

/**
 * Small single-series area chart with an optional dashed reference line
 * (SLO or target). Static SVG, drawn to one scale.
 */
@Component({
  selector: 'app-spark-chart',
  template: `
    <figure class="spark">
      <figcaption class="spark__head">
        <span class="u-meta">{{ label() }}</span>
        <strong class="spark__value">{{ current() }}</strong>
      </figcaption>
      <svg [attr.viewBox]="'0 0 ' + width + ' 118'" role="img" [attr.aria-label]="label() + ', last 24 hours'">
        <line class="spark__axis" x1="0" [attr.x2]="width" [attr.y1]="base" [attr.y2]="base" />
        @if (refY() !== null) {
          <line class="spark__ref" x1="0" [attr.x2]="width" [attr.y1]="refY()" [attr.y2]="refY()" />
          <text class="spark__label" [attr.x]="width - 2" [attr.y]="(refY() ?? 0) - 5" text-anchor="end">
            {{ refLabel() }}
          </text>
        }
        <path class="spark__area" [attr.d]="area()" />
        <polyline class="spark__line" [attr.points]="points()" />
        <circle class="spark__dot" [attr.cx]="width" [attr.cy]="lastY()" r="4.5" />
        <text class="spark__label" x="0" y="114">{{ startLabel() }}</text>
        <text class="spark__label" [attr.x]="width" y="114" text-anchor="end">now</text>
      </svg>
    </figure>
  `,
  styleUrl: './spark-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkChartComponent {
  readonly label = input.required<string>();
  readonly values = input.required<number[]>();
  readonly max = input.required<number>();
  readonly format = input<(v: number) => string>((v) => String(v));
  readonly reference = input<number | null>(null);
  readonly refLabel = input('');
  readonly startLabel = input('11:00');

  protected readonly width = W;
  protected readonly base = BASE;

  private y(v: number): number {
    return TOP + H - (Math.min(v, this.max()) / this.max()) * H;
  }

  private x(i: number): number {
    return (i * W) / (this.values().length - 1);
  }

  protected readonly points = computed(() =>
    this.values()
      .map((v, i) => `${this.x(i).toFixed(1)},${this.y(v).toFixed(1)}`)
      .join(' '),
  );

  protected readonly area = computed(() => `M0,${BASE} L${this.points().split(' ').join(' L')} L${W},${BASE} Z`);
  protected readonly lastY = computed(() => this.y(this.values()[this.values().length - 1]));
  protected readonly current = computed(() => this.format()(this.values()[this.values().length - 1]));
  protected readonly refY = computed(() => {
    const r = this.reference();
    return r === null ? null : this.y(r);
  });
}
