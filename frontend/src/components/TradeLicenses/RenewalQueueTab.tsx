import { useQuery } from '@tanstack/react-query';
import { tradeLicensesApi } from '@/api';
import { Business, TradeLicenseRecord } from '@/types';

interface RenewalQueueTabProps {
  startServiceForBusiness: (biz: Business, service: TradeLicenseRecord['serviceType']) => void;
}

export default function RenewalQueueTab({ startServiceForBusiness }: RenewalQueueTabProps) {
  const { data: renewalQueue = [], isLoading: renewalLoading } = useQuery({
    queryKey: ['trade-renewal-queue'],
    queryFn: () => tradeLicensesApi.getRenewalQueue().then((r) => r.data),
  });

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: 14, color: 'var(--text-muted)' }}>
        Businesses due for license renewal (Active only from March to April)
      </div>
      {renewalLoading ? (
        <div style={{ padding: 20 }}>Loading...</div>
      ) : renewalQueue.length === 0 ? (
        <div style={{ padding: 20, color: 'var(--text-muted)' }}>
          No businesses due for renewal at this time (the queue is active only during March and April).
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Business Name</th>
              <th>License Number</th>
              <th>Trade category</th>
              <th>Last Renewed Year</th>
              <th>Owners / Partners</th>
              <th style={{ width: 120 }}></th>
            </tr>
          </thead>
          <tbody>
            {renewalQueue.map((b) => (
              <tr key={b.id}>
                <td style={{ fontWeight: 500 }}>{b.name}</td>
                <td>
                  <span className="badge badge-green">{b.licenseNo}</span>
                </td>
                <td>
                  {b.tradeType} ({b.tradeSubtype})
                </td>
                <td>{b.lastRenewalYear || 'Never'}</td>
                <td>{b.customers?.map((c: any) => c.name).join(', ') || '—'}</td>
                <td>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => startServiceForBusiness(b, 'Renew')}
                  >
                    Process Renew
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
