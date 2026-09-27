import { Route, Routes } from '@angular/router';

import { PersonaId } from './core/personas';
import { ShellComponent } from './layout/shell/shell.component';
import { PlaceholderPageComponent } from './shared/placeholder/placeholder-page.component';

/** Screen not built yet: routes to the placeholder with its prototype code. */
function planned(path: string, title: string, code: string): Route {
  return { path, component: PlaceholderPageComponent, title: `${title} · Nova`, data: { title, code } };
}

function personaShell(persona: PersonaId, children: Routes): Route {
  return {
    path: persona,
    component: ShellComponent,
    data: { persona },
    children: [{ path: '', pathMatch: 'full', redirectTo: 'dashboard' }, ...children],
  };
}

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'account/dashboard' },

  // Sutter Health (Account)
  personaShell('account', [
    {
      path: 'dashboard',
      title: 'Dashboard · Nova',
      loadComponent: () =>
        import('./features/account/dashboard/account-dashboard.component').then((m) => m.AccountDashboardComponent),
    },
    planned('apps', 'My apps', 'S2'),
    planned('apps/new/basics', 'Register app: Basics', 'S3'),
    planned('apps/new/resources', 'Register app: Resources', 'S4'),
    planned('apps/new/auth', 'Register app: Auth & endpoints', 'S5'),
    planned('apps/:appId', 'App overview', 'S6'),
    planned('apps/:appId/credentials', 'Credentials', 'S7'),
    planned('sandbox', 'Sandbox tester', 'S8'),
    planned('apps/:appId/production', 'Request production access', 'S9'),
    planned('usage', 'Usage & analytics', 'S10'),
    planned('team', 'Team & members', 'S11'),
    planned('team/:memberId', 'Member detail', 'S12'),
    planned('settings', 'Account settings', 'S13'),
    planned('docs', 'Documentation', 'S14'),
    planned('consent', 'Member consent', 'S15'),
  ]),

  // UMR (Org)
  personaShell('org', [
    {
      path: 'dashboard',
      title: 'Org dashboard · Nova',
      loadComponent: () =>
        import('./features/org/dashboard/org-dashboard.component').then((m) => m.OrgDashboardComponent),
    },
    planned('accounts', 'Accounts', 'U2'),
    planned('approvals', 'App approvals & allow-list', 'U3'),
    planned('team', 'Team & SSO', 'U4'),
    planned('billing', 'Billing & invoices', 'U5'),
    planned('usage', 'Usage & reports', 'U6'),
    planned('settings', 'Org settings', 'U7'),
    planned('support', 'Support', 'U8'),
  ]),

  // DataLink (Platform)
  personaShell('platform', [
    {
      path: 'dashboard',
      title: 'Platform dashboard · Nova',
      loadComponent: () =>
        import('./features/platform/dashboard/platform-dashboard.component').then((m) => m.PlatformDashboardComponent),
    },
    planned('approvals', 'Approvals across orgs', 'D2'),
    planned('sources', 'Source systems', 'D3'),
    planned('provisioning', 'Orgs & provisioning', 'D4'),
    planned('registry', 'App registry', 'D5'),
    planned('rate-limits', 'Rate limits', 'D6'),
    planned('tiers', 'Partner tiers', 'D7'),
    planned('metering', 'Metering & billing', 'D8'),
    planned('audit', 'Audit log', 'D9'),
    planned('incidents', 'Incident console', 'D10'),
    planned('support', 'Support console', 'D11'),
  ]),

  { path: '**', redirectTo: 'account/dashboard' },
];
