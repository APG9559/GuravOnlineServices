import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api';
import { useAuth } from '@/context/AuthContext';
import NetEarningsChart from '@/components/Dashboard/NetEarningsChart';
import PerformanceCard from './dashboard/components/PerformanceCard';
import ModuleGrid from './dashboard/components/ModuleGrid';
import FilterCard from './dashboard/components/FilterCard';
import BreakdownDetails from './dashboard/components/BreakdownDetails';
import UserPerformanceTable from './dashboard/components/UserPerformanceTable';

export default function DashboardPage() {
  const { user } = useAuth();
  const [filterParams, setFilterParams] = useState<{ from?: string; to?: string }>({});

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', filterParams],
    queryFn: () => dashboardApi.getSummary(filterParams).then((r) => r.data),
  });

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {today} — Welcome back, {user?.name}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
      ) : data ? (
        <>
          {/* ── Date range banner ── */}
          <div className="stats-banner">
            <div>
              Showing statistics for: <span style={{ fontWeight: 700 }}>{formatDateString(data.fromDate)}</span> to <span style={{ fontWeight: 700 }}>{formatDateString(data.toDate)}</span>
              {(!filterParams.from && !filterParams.to) && (
                <span className="badge badge-blue" style={{ marginLeft: 8 }}>Current Month</span>
              )}
            </div>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Real-time Sync
            </span>
          </div>

          {/* ── Grand Summary Card ── */}
          <PerformanceCard data={data} />

          {/* ── Chart ── */}
          <div style={{ marginBottom: '1.5rem' }}>
            <NetEarningsChart data={data.dailyEarnings} />
          </div>

          {/* ── Service Modules Grid ── */}
          <ModuleGrid data={data} />

          {/* ── Filters & Breakdown Details ── */}
          <div className="grid-2">
            <FilterCard
              onApplyFilter={(params) => setFilterParams(params)}
              onResetFilter={() => setFilterParams({})}
            />
            <BreakdownDetails data={data} />
          </div>

          {/* ── User Performance Breakdown ── */}
          <UserPerformanceTable userBreakdown={data.userBreakdown} />
        </>
      ) : null}
    </div>
  );
}
