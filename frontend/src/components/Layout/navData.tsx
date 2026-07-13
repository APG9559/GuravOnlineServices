import { ReactNode } from 'react';
import {
  DashboardIcon,
  RecordsIcon,
  PaymentsIcon,
  CustomersIcon,
  ReferencesIcon,
  SettingsIcon,
  UsersIcon,
} from './icons';
import { ServiceGroup } from './Dropdowns';

export const dashboardLink = {
  to: '/',
  label: 'Dashboard',
  end: true,
  icon: <DashboardIcon />,
};

export const serviceGroups: ServiceGroup[] = [
  {
    label: 'KMC Services',
    activePaths: [
      '/marriages',
      '/birth-death',
      '/trade-licenses',
      '/water-supply',
      '/property-tax',
    ],
    items: [
      { to: '/marriages', label: 'Marriages' },
      { to: '/birth-death', label: 'Birth/Death' },
      { to: '/trade-licenses', label: 'Trade Licenses' },
      { to: '/water-supply', label: 'Water Supply' },
      { to: '/property-tax', label: 'Property Tax' },
    ],
  },
  {
    label: 'CSC Services',
    activePaths: ['/pan-cards', '/passports'],
    items: [
      { to: '/pan-cards', label: 'PAN Cards' },
      { to: '/passports', label: 'Passports' },
    ],
  },
  {
    label: 'Aaple Sarkar',
    activePaths: ['/affidavits', '/property-cards', '/shop-act', '/gazettes', '/voter-cards'],
    items: [
      { to: '/affidavits', label: 'Affidavits' },
      { to: '/property-cards', label: 'Property Cards' },
      { to: '/shop-act', label: 'Shop Act' },
      { to: '/gazettes', label: 'Gazette' },
      { to: '/voter-cards', label: 'Voter Cards' },
    ],
  },
];

export interface BottomNavLink {
  to: string;
  label: string;
  icon: ReactNode;
}

export const bottomNavLinks: BottomNavLink[] = [
  { to: '/records', label: 'Records', icon: <RecordsIcon /> },
  { to: '/payments', label: 'Payments', icon: <PaymentsIcon /> },
  { to: '/customers', label: 'Customers', icon: <CustomersIcon /> },
  { to: '/references', label: 'References', icon: <ReferencesIcon /> },
  { to: '/settings', label: 'Settings', icon: <SettingsIcon /> },
];

export function getAdminLinks(): BottomNavLink[] {
  return [{ to: '/users', label: 'Users', icon: <UsersIcon /> }];
}
