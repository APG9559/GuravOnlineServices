import ServiceCrudPage from '@/components/ServiceCrudPage';
import { affidavitConfig } from '@/config/servicePages';

export default function AffidavitsPage() {
  return <ServiceCrudPage config={affidavitConfig} />;
}
