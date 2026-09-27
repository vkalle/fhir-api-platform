import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { hourlyOps } from '../../../data/metrics.mock';
import { OpsTrioComponent } from '../../../shared/charts/ops-trio.component';

/** D1 · DataLink platform dashboard. Approvals are view-only here. */
@Component({
  selector: 'app-platform-dashboard',
  imports: [RouterLink, OpsTrioComponent],
  templateUrl: './platform-dashboard.component.html',
  styleUrl: './platform-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformDashboardComponent {
  protected readonly ops = hourlyOps(2.4, 22);

  protected readonly orgs = [
    {
      name: 'UMR',
      link: '/org/dashboard',
      accounts: '18 / 25',
      req: '2.41M',
      p95: '298 ms',
      slow: false,
      failed: '0.7%',
      bad: false,
      pending: 4,
      db: 'Healthy',
      dbTone: 'success',
    },
    {
      name: 'Wisconsin Health Plan',
      link: null,
      accounts: '14 / 25',
      req: '2.02M',
      p95: '441 ms',
      slow: true,
      failed: '1.3%',
      bad: true,
      pending: 1,
      db: 'Degraded',
      dbTone: 'warning',
    },
    {
      name: 'Great Lakes Benefits',
      link: null,
      accounts: '9 / 25',
      req: '1.39M',
      p95: '256 ms',
      slow: false,
      failed: '0.4%',
      bad: false,
      pending: 0,
      db: 'Healthy',
      dbTone: 'success',
    },
  ];

  protected readonly failing = [
    {
      app: 'Member Outreach Hub',
      where: 'WHP › Dairyland Co-op',
      req: '312k',
      failed: '4.1%',
      bad: true,
      error: '504 upstream timeout',
      p95: '1.2 s',
    },
    {
      app: 'Baylor Benefits Sync',
      where: 'UMR › Baylor University',
      req: '96k',
      failed: '3.2%',
      bad: true,
      error: '403 insufficient_scope',
      p95: '402 ms',
    },
    {
      app: 'Crew Benefits Portal',
      where: 'UMR › Duke Health',
      req: '154k',
      failed: '0.9%',
      bad: false,
      error: '429 too_many_requests',
      p95: '334 ms',
    },
    {
      app: 'UM Authorizations Sync',
      where: 'UMR › Sutter Health',
      req: '198k',
      failed: '0.9%',
      bad: false,
      error: '404 not_found',
      p95: '341 ms',
    },
  ];
}
