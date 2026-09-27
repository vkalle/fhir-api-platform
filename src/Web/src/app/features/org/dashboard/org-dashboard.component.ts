import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { hourlyOps } from '../../../data/metrics.mock';
import { OpsTrioComponent } from '../../../shared/charts/ops-trio.component';

type Decision = 'approved' | 'changes';

interface PendingApp {
  id: string;
  app: string;
  account: string;
  type: 'FHIR' | 'API';
  access: string;
  waiting: string;
}

/** U1 · UMR Org dashboard with approvals in the right rail. */
@Component({
  selector: 'app-org-dashboard',
  imports: [RouterLink, OpsTrioComponent],
  templateUrl: './org-dashboard.component.html',
  styleUrl: './org-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgDashboardComponent {
  protected readonly ops = hourlyOps(1, 22);

  protected readonly pending: PendingApp[] = [
    {
      id: 'a',
      app: 'Sutter Care Management Feed',
      account: 'Sutter Health',
      type: 'FHIR',
      access: '14 resources',
      waiting: '5 days',
    },
    {
      id: 'b',
      app: 'Provider Directory Lookup',
      account: 'Sutter Health',
      type: 'API',
      access: '4 endpoints',
      waiting: '10 days',
    },
    {
      id: 'c',
      app: 'Associate Wellness Sync',
      account: 'Stellantis',
      type: 'FHIR',
      access: '8 resources',
      waiting: '3 days',
    },
    {
      id: 'd',
      app: 'Claims Status Kiosk',
      account: 'Crown Holdings',
      type: 'API',
      access: '3 endpoints',
      waiting: '1 day',
    },
  ];

  protected readonly decisions = signal<Record<string, Decision | undefined>>({});
  protected readonly openCount = computed(() => this.pending.filter((p) => !this.decisions()[p.id]).length);

  protected decide(id: string, decision: Decision | undefined): void {
    this.decisions.update((d) => ({ ...d, [id]: decision }));
  }

  protected readonly accounts = [
    {
      name: 'Baylor University',
      req: '96k',
      p95: '402 ms',
      slow: true,
      failed: '3.2%',
      bad: true,
      issues: [{ label: 'Failures', tone: 'error' }],
    },
    {
      name: 'Sutter Health',
      req: '412k',
      p95: '312 ms',
      slow: false,
      failed: '0.6%',
      bad: false,
      link: '/account/dashboard',
      issues: [
        { label: '2 to approve', tone: 'review' },
        { label: 'Over soft limit', tone: 'warning' },
      ],
    },
    {
      name: 'Stellantis',
      req: '688k',
      p95: '281 ms',
      slow: false,
      failed: '0.6%',
      bad: false,
      issues: [
        { label: '1 to approve', tone: 'review' },
        { label: 'Key expiring', tone: 'warning' },
      ],
    },
    {
      name: 'Duke Health',
      req: '154k',
      p95: '334 ms',
      slow: false,
      failed: '0.9%',
      bad: false,
      issues: [{ label: 'Rate-limit warning', tone: 'warning' }],
    },
    {
      name: 'Crown Holdings',
      req: '21k',
      p95: '210 ms',
      slow: false,
      failed: '0.2%',
      bad: false,
      issues: [{ label: '1 to approve', tone: 'review' }],
    },
    {
      name: 'University of Arkansas System',
      req: '118k',
      p95: '266 ms',
      slow: false,
      failed: '0.4%',
      bad: false,
      issues: [{ label: 'Healthy', tone: 'success' }],
    },
  ];

  protected readonly alerts = [
    { tone: 'error', label: 'Failures', text: 'Baylor University failing 3.2% for 40 min, mostly 403s' },
    { tone: 'warning', label: 'Rate limit', text: 'Sutter Health at 412 req/60s, soft limit 400' },
    { tone: 'warning', label: 'Key expiring', text: 'Stellantis signing key expires in 3 days' },
    { tone: 'muted', label: 'DataLink', text: 'Care Plan Export (Sutter Health) frozen by DataLink, Jun 27' },
  ];
}
