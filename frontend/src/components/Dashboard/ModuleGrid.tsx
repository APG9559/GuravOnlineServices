import { DashboardSummary } from '@/types';

interface ModuleGridProps {
  data: DashboardSummary;
}

export default function ModuleGrid({ data }: ModuleGridProps) {
  return (
    <div className="grid-3" style={{ marginBottom: '1.5rem', gap: 16 }}>
      {['kmc', 'csc', 'aapleSarkar'].map((moduleKey) => {
        const m = data.modules[moduleKey as 'kmc' | 'csc' | 'aapleSarkar'];
        if (!m) return null;

        const moduleColors: Record<string, { bg: string; text: string; border: string; badge: string }> = {
          kmc: { bg: 'rgba(99, 102, 241, 0.05)', text: 'rgb(79, 70, 229)', border: 'rgba(99, 102, 241, 0.2)', badge: 'badge-blue' },
          csc: { bg: 'rgba(245, 158, 11, 0.05)', text: 'rgb(217, 119, 6)', border: 'rgba(245, 158, 11, 0.2)', badge: 'badge-amber' },
          aapleSarkar: { bg: 'rgba(16, 185, 129, 0.05)', text: 'rgb(5, 150, 105)', border: 'rgba(16, 185, 129, 0.2)', badge: 'badge-green' }
        };

        const colors = moduleColors[moduleKey] || { bg: 'var(--surface)', text: 'var(--text)', border: 'var(--border)', badge: 'badge-blue' };

        return (
          <div
            className="card"
            key={moduleKey}
            style={{
              display: 'flex',
              flexDirection: 'column',
              border: `1.5px solid ${colors.border}`,
              background: 'var(--surface)',
              boxShadow: '4px 4px 0px #000000',
              borderRadius: '8px',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '2px solid #000000', paddingBottom: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 16, color: '#000000' }}>{m.label}</span>
              <span className={`badge ${colors.badge}`} style={{ fontSize: 11, fontWeight: 700 }}>
                {m.count} records
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: '1.25rem', background: colors.bg, padding: '10px 12px', borderRadius: 6, border: `1px solid ${colors.border}` }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-hint)', fontWeight: 600, textTransform: 'uppercase' }}>Gross</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#000000' }}>₹{m.grossEarnings.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-hint)', fontWeight: 600, textTransform: 'uppercase' }}>Net</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: colors.text }}>₹{m.netEarnings.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Sub-services</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(m.subServices).map(([subKey, sub]: [string, any]) => (
                  <div
                    key={subKey}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 8px',
                      background: '#fafafa',
                      borderRadius: 4,
                      border: '1px solid #eee',
                      fontSize: 13,
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: '#000000' }}>{sub.label}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>({sub.count})</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#000000' }}>₹{sub.grossEarnings.toLocaleString('en-IN')} <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 'normal' }}>g</span></div>
                      <div style={{ fontWeight: 700, fontSize: 11, color: 'var(--text-muted)' }}>₹{sub.netEarnings.toLocaleString('en-IN')} <span style={{ fontSize: 9, fontWeight: 'normal' }}>n</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
