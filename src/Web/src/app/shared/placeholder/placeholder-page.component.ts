import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** Route target for screens designed in the prototype but not yet coded. */
@Component({
  selector: 'app-placeholder-page',
  template: `
    <header>
      <h1>{{ title }}</h1>
      <p class="u-meta">Screen {{ code }} in the Nova prototype.</p>
    </header>
    <section class="dl-card">
      <h2 class="dl-card__title">Planned for phase 2</h2>
      <p class="dl-card__subtitle">
        The layout, content and behaviour for this screen are defined in the design canvas. It will be built with the
        same tokens and shared components as the dashboards.
      </p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceholderPageComponent {
  private readonly data = inject(ActivatedRoute).snapshot.data;
  protected readonly title: string = this.data['title'];
  protected readonly code: string = this.data['code'];
}
