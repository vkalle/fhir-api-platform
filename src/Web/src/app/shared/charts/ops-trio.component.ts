import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { HourlyOps } from '../../data/metrics.mock';
import { SparkChartComponent } from './spark-chart.component';

/** Volume, speed and failures as three small multiples on the same hourly axis. */
@Component({
  selector: 'app-ops-trio',
  imports: [SparkChartComponent],
  template: `
    <section class="dl-card">
      <h2 class="dl-card__title">Volume, speed and failures</h2>
      <p class="dl-card__subtitle">{{ subtitle() }}</p>
      <div class="dl-grid dl-grid--3 trio">
        <app-spark-chart label="Requests / hour" [values]="ops().volume" [max]="volumeMax()" [format]="k" />
        <app-spark-chart
          label="Speed p95"
          [values]="ops().p95"
          [max]="600"
          [reference]="500"
          refLabel="SLO 500 ms"
          [format]="ms"
        />
        <app-spark-chart
          label="Failed"
          [values]="ops().failedPct"
          [max]="3.5"
          [reference]="1"
          refLabel="1% target"
          [format]="pct"
        />
      </div>
    </section>
  `,
  styles: '.trio { margin-top: 12px; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpsTrioComponent {
  readonly ops = input.required<HourlyOps>();
  readonly volumeMax = input(150000);
  readonly subtitle = input('Per hour, last 24 hours');

  protected readonly k = (v: number) => `${Math.round(v / 1000)}k`;
  protected readonly ms = (v: number) => `${v} ms`;
  protected readonly pct = (v: number) => `${v.toFixed(1)}%`;
}
