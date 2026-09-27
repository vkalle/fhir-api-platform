import { ChangeDetectionStrategy, Component, HostListener, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PERSONAS, PersonaMeta } from '../../core/personas';
import { IconComponent } from '../../shared/icon/icon.component';

/** Top bar with Org/Account context and the demo persona switcher. */
@Component({
  selector: 'app-topbar',
  imports: [RouterLink, IconComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  readonly persona = input.required<PersonaMeta>();

  protected readonly personas = Object.values(PERSONAS);
  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  @HostListener('document:keydown.escape')
  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
