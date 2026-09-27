import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';

import { NAV, PERSONAS, PersonaId } from '../../core/personas';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

/** Page frame for one persona: top bar, sidebar and the routed screen. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, TopbarComponent, SidebarComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly personaId = toSignal(this.route.data.pipe(map((d) => d['persona'] as PersonaId)), {
    initialValue: 'account' as PersonaId,
  });

  protected readonly persona = computed(() => PERSONAS[this.personaId()]);
  protected readonly nav = computed(() => NAV[this.personaId()]);
}
