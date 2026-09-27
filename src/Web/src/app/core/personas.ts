import { IconName } from '../shared/icon/icon.component';

export type PersonaId = 'account' | 'org' | 'platform';

export interface PersonaMeta {
  id: PersonaId;
  name: string;
  role: string;
  subtitle: string;
  initials: string;
  badge: string;
  context: { label: string; value: string }[];
  home: string;
}

export interface NavItem {
  label: string;
  path: string;
  icon: IconName;
}

export interface NavSection {
  heading?: string;
  items: NavItem[];
}

export const PERSONAS: Record<PersonaId, PersonaMeta> = {
  account: {
    id: 'account',
    name: 'Sutter Health',
    role: 'Account Admin',
    subtitle: 'Account · UMR',
    initials: 'PR',
    badge: 'S',
    context: [
      { label: 'Org', value: 'UMR' },
      { label: 'Account', value: 'Sutter Health' },
    ],
    home: '/account/dashboard',
  },
  org: {
    id: 'org',
    name: 'UMR',
    role: 'Org Admin',
    subtitle: 'Org · 18 of 25 Accounts',
    initials: 'JE',
    badge: 'U',
    context: [
      { label: 'Org', value: 'UMR' },
      { label: 'Accounts', value: '18' },
    ],
    home: '/org/dashboard',
  },
  platform: {
    id: 'platform',
    name: 'DataLink',
    role: 'Platform Admin',
    subtitle: 'Platform',
    initials: 'HA',
    badge: 'D',
    context: [{ label: 'Platform', value: 'DataLink administration' }],
    home: '/platform/dashboard',
  },
};

export const NAV: Record<PersonaId, NavSection[]> = {
  account: [
    { items: [{ label: 'Dashboard', path: 'dashboard', icon: 'dashboard' }] },
    {
      heading: 'Build',
      items: [
        { label: 'My apps', path: 'apps', icon: 'grid' },
        { label: 'Sandbox', path: 'sandbox', icon: 'flask' },
        { label: 'Usage & analytics', path: 'usage', icon: 'activity' },
        { label: 'Documentation', path: 'docs', icon: 'book' },
      ],
    },
    {
      heading: 'Admin',
      items: [
        { label: 'Team & members', path: 'team', icon: 'users' },
        { label: 'Consent', path: 'consent', icon: 'shield' },
        { label: 'Account settings', path: 'settings', icon: 'sliders' },
      ],
    },
  ],
  org: [
    {
      items: [
        { label: 'Dashboard', path: 'dashboard', icon: 'dashboard' },
        { label: 'Accounts', path: 'accounts', icon: 'building' },
        { label: 'App approvals', path: 'approvals', icon: 'shield' },
        { label: 'Usage & reports', path: 'usage', icon: 'activity' },
        { label: 'Billing & invoices', path: 'billing', icon: 'card' },
      ],
    },
    {
      heading: 'Admin',
      items: [
        { label: 'Team & SSO', path: 'team', icon: 'users' },
        { label: 'Settings', path: 'settings', icon: 'sliders' },
        { label: 'Support', path: 'support', icon: 'buoy' },
      ],
    },
  ],
  platform: [
    { items: [{ label: 'Dashboard', path: 'dashboard', icon: 'dashboard' }] },
    { heading: 'Oversight', items: [{ label: 'Approvals', path: 'approvals', icon: 'inbox' }] },
    {
      heading: 'Manage',
      items: [
        { label: 'Orgs & provisioning', path: 'provisioning', icon: 'building' },
        { label: 'Source systems', path: 'sources', icon: 'database' },
        { label: 'App registry', path: 'registry', icon: 'grid' },
        { label: 'Rate limits', path: 'rate-limits', icon: 'gauge' },
        { label: 'Partner tiers', path: 'tiers', icon: 'layers' },
      ],
    },
    {
      heading: 'Operate',
      items: [
        { label: 'Audit log', path: 'audit', icon: 'file' },
        { label: 'Incident console', path: 'incidents', icon: 'alert' },
        { label: 'Metering & billing', path: 'metering', icon: 'card' },
        { label: 'Support console', path: 'support', icon: 'buoy' },
      ],
    },
  ],
};
