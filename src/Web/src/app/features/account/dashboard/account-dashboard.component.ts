import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { compact, dailyByDomain } from '../../../data/metrics.mock';
import { ChartSeries, LineChartComponent } from '../../../shared/charts/line-chart.component';

type View = 'ops' | 'changes';
type Range = 7 | 30;
type Tone = 'success' | 'error' | 'warning' | 'info' | 'review' | 'muted';

const DAILY = dailyByDomain();

/** S1 · Sutter Health dashboard: operations and changes & approvals. */
@Component({
  selector: 'app-account-dashboard',
  imports: [LineChartComponent],
  templateUrl: './account-dashboard.component.html',
  styleUrl: './account-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountDashboardComponent {
  protected readonly view = signal<View>('ops');
  protected readonly range = signal<Range>(30);

  private readonly offset = computed(() => 30 - this.range());

  protected readonly series = computed<ChartSeries[]>(() => [
    { name: 'Care Management', short: 'Care Mgmt', values: DAILY.cm.slice(this.offset()) },
    { name: 'Utilization Management', short: 'UM', values: DAILY.um.slice(this.offset()) },
    { name: 'Appeals & Grievances', short: 'A&G', values: DAILY.ag.slice(this.offset()) },
  ]);
  protected readonly labels = computed(() => DAILY.labels.slice(this.offset()));
  protected readonly totalRequests = computed(() =>
    compact(this.series().reduce((sum, s) => sum + s.values.reduce((a, b) => a + b, 0), 0)),
  );
  private readonly scale = computed(() => this.range() / 30);

  protected readonly topResources = computed(() =>
    [
      { name: 'CarePlan', kind: 'FHIR · Care Mgmt', v: 412000 },
      { name: 'Patient', kind: 'FHIR · Core', v: 388000 },
      { name: '/authorizations', kind: 'API · UM', v: 301000 },
      { name: 'ServiceRequest', kind: 'FHIR · UM', v: 214000 },
      { name: 'Coverage', kind: 'FHIR · Core', v: 190000 },
      { name: 'CareTeam', kind: 'FHIR · Care Mgmt', v: 142000 },
      { name: '/appeals', kind: 'API · A&G', v: 96000 },
    ].map((r) => ({ ...r, value: compact(Math.round(r.v * this.scale())), pct: Math.round((r.v / 412000) * 100) })),
  );

  protected readonly callers = computed(() =>
    [
      {
        app: 'Sutter Care Management Feed',
        who: 'Primary backend',
        kind: 'Client credential',
        type: 'FHIR',
        req: 820000,
        err: '0.3%',
        p95: '284 ms',
        last: '2 min ago',
      },
      {
        app: 'UM Authorizations Sync',
        who: 'Production backend',
        kind: 'Client credential',
        type: 'API',
        req: 610000,
        err: '0.9%',
        p95: '341 ms',
        last: 'Just now',
      },
      {
        app: 'Sutter Care Management Feed',
        who: 'CareBridge vendor',
        kind: 'Client credential',
        type: 'FHIR',
        req: 214000,
        err: '0.4%',
        p95: '302 ms',
        last: '14 min ago',
      },
      {
        app: 'Appeals Case Viewer',
        who: 'Marcus Lee',
        kind: 'Account User · sandbox',
        type: 'FHIR',
        req: 9400,
        err: '2.1%',
        p95: '410 ms',
        last: 'Yesterday',
      },
    ].map((c) => ({ ...c, requests: compact(Math.round(c.req * this.scale())) })),
  );

  protected readonly log = [
    {
      when: '10:42:18',
      who: 'UM Authorizations Sync',
      path: '/authorizations?status=pending',
      status: '200',
      tone: 'success' as Tone,
      ms: '188 ms',
      n: 42,
    },
    {
      when: '10:42:11',
      who: 'Sutter Care Management Feed',
      path: '/CarePlan?status=active&_count=100',
      status: '200',
      tone: 'success' as Tone,
      ms: '264 ms',
      n: 100,
    },
    {
      when: '10:41:57',
      who: 'Sutter Care Management Feed',
      path: '/Patient/eXY3Kp9mQr2Lb',
      status: '200',
      tone: 'success' as Tone,
      ms: '61 ms',
      n: 1,
    },
    {
      when: '10:41:40',
      who: 'CareBridge vendor',
      path: '/Claim?patient=B4507',
      status: '403',
      tone: 'error' as Tone,
      ms: '22 ms',
      n: 0,
    },
    {
      when: '10:41:12',
      who: 'UM Authorizations Sync',
      path: '/service-plans?member=B4233',
      status: '200',
      tone: 'success' as Tone,
      ms: '233 ms',
      n: 3,
    },
  ];

  protected readonly approvals = [
    {
      app: 'Sutter Care Management Feed',
      kind: 'Production access',
      waiting: 'UMR review',
      tone: 'review' as Tone,
      days: 1,
    },
    {
      app: 'Appeals Case Viewer',
      kind: 'Production access',
      waiting: 'Changes requested',
      tone: 'warning' as Tone,
      days: 4,
    },
    {
      app: 'Provider Directory Lookup',
      kind: 'Production access',
      waiting: 'UMR review',
      tone: 'review' as Tone,
      days: 6,
    },
  ];

  protected readonly expiring = [
    {
      item: 'sutter-cm-2026-06',
      kind: 'Signing key',
      app: 'Care Management Feed',
      when: 'In 3 days',
      tone: 'warning' as Tone,
    },
    {
      item: 'Production backend',
      kind: 'Client credential',
      app: 'UM Authorizations Sync',
      when: 'In 12 days',
      tone: 'warning' as Tone,
    },
    {
      item: 'CareBridge vendor',
      kind: 'Client credential',
      app: 'Care Management Feed',
      when: 'In 27 days',
      tone: 'muted' as Tone,
    },
  ];

  protected readonly activity = [
    { who: 'Priya Raman', what: 'submitted Sutter Care Management Feed to UMR for production', when: 'Today, 09:12' },
    { who: 'Priya Raman', what: 'invited Tom Okafor as Account User', when: 'Sep 26' },
    { who: 'Jordan Ellis (UMR)', what: 'requested changes on Appeals Case Viewer', when: 'Sep 23' },
    { who: 'Sam Patel', what: 'registered Member Roster Loader (API)', when: 'Sep 21' },
    { who: 'Marcus Lee', what: 'created credential "CareBridge vendor"', when: 'Sep 20' },
  ];
}
