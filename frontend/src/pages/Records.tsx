import React from 'react';
import { SubTab, RecordTypeBySubTab } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  AffidavitReceipt,
  MarriageReceipt,
  BirthDeathReceipt,
  PropertyCardReceipt,
  ShopActLicenseReceipt,
  TradeLicenseReceipt,
  PanCardReceipt,
  PassportReceipt,
  VoterCardReceipt,
  GazetteReceipt,
  WaterSupplyReceipt,
  PropertyTaxReceipt,
} from '@/components/ReceiptModal/Receipt';
import { usePricing } from '@/hooks/usePricing';
import RecordEditModal from '@/components/RecordEditModal';
import ViewRecordModal from '@/components/ViewRecordModal';

// Hooks & Subcomponents
import { useRecordsFilter, TopCategory } from '@/components/Records/hooks/useRecordsFilter';
import FilterBar from '@/components/Records/components/FilterBar';
import RecordsTable from '@/components/Records/components/RecordsTable';
import { COLUMNS_MAP } from './Records/constants.tsx';
import { useRecordExport } from './Records/useRecordExport';

const RECEIPT_MAP: Record<SubTab, React.ComponentType<{ record: any }>> = {
  affidavits: AffidavitReceipt,
  marriages: MarriageReceipt,
  birthDeath: BirthDeathReceipt,
  propertyCards: PropertyCardReceipt,
  shopAct: ShopActLicenseReceipt,
  tradeLicenses: TradeLicenseReceipt,
  panCards: PanCardReceipt,
  passports: PassportReceipt,
  voterCards: VoterCardReceipt,
  gazettes: GazetteReceipt,
  waterSupplies: WaterSupplyReceipt,
  propertyTaxes: PropertyTaxReceipt,
};

export default function RecordsPage() {
  const { isAdmin } = useAuth();
  const { pricing } = usePricing();

  const recordsFilter = useRecordsFilter();
  const {
    topCategory,
    subTab,
    setSubTab,
    search,
    setSearch,
    debouncedSearch,
    from,
    setFrom,
    to,
    setTo,
    authorizerType,
    setAuthorizerType,
    editingRecord,
    setEditingRecord,
    viewingRecord,
    setViewingRecord,
    printRecord,
    currentPage,
    setCurrentPage,
    PAGE_SIZE,
    recordsList,
    totalCount,
    totalPages,
    isLoading,
    deleteMutation,
    updateMutation,
    triggerPrint,
    handleTopCategoryChange,
    receiptRef,
  } = recordsFilter;

  const { exportCurrent } = useRecordExport({
    subTab,
    debouncedSearch,
    from,
    to,
    authorizerType,
  });

  const KMC_SUB_TABS = [
    {
      key: 'marriages' as SubTab,
      label: 'Marriages',
      count: subTab === 'marriages' ? totalCount : 0,
    },
    {
      key: 'birthDeath' as SubTab,
      label: 'Birth/Death',
      count: subTab === 'birthDeath' ? totalCount : 0,
    },
    {
      key: 'tradeLicenses' as SubTab,
      label: 'Trade Licenses',
      count: subTab === 'tradeLicenses' ? totalCount : 0,
    },
    {
      key: 'waterSupplies' as SubTab,
      label: 'Water Supply',
      count: subTab === 'waterSupplies' ? totalCount : 0,
    },
    {
      key: 'propertyTaxes' as SubTab,
      label: 'Property Tax',
      count: subTab === 'propertyTaxes' ? totalCount : 0,
    },
  ];

  const CSC_SUB_TABS = [
    {
      key: 'panCards' as SubTab,
      label: 'PAN Cards',
      count: subTab === 'panCards' ? totalCount : 0,
    },
    {
      key: 'passports' as SubTab,
      label: 'Passports',
      count: subTab === 'passports' ? totalCount : 0,
    },
  ];

  const AAPLE_SARKAR_SUB_TABS = [
    {
      key: 'affidavits' as SubTab,
      label: 'Affidavits',
      count: subTab === 'affidavits' ? totalCount : 0,
    },
    {
      key: 'propertyCards' as SubTab,
      label: 'Property Cards',
      count: subTab === 'propertyCards' ? totalCount : 0,
    },
    {
      key: 'shopAct' as SubTab,
      label: 'Shop Act Licenses',
      count: subTab === 'shopAct' ? totalCount : 0,
    },
    { key: 'gazettes' as SubTab, label: 'Gazette', count: subTab === 'gazettes' ? totalCount : 0 },
    {
      key: 'voterCards' as SubTab,
      label: 'Voter Cards',
      count: subTab === 'voterCards' ? totalCount : 0,
    },
  ];

  const KMC_COUNT = KMC_SUB_TABS.reduce((acc, t) => acc + t.count, 0);
  const CSC_COUNT = CSC_SUB_TABS.reduce((acc, t) => acc + t.count, 0);
  const AAPLE_SARKAR_COUNT = AAPLE_SARKAR_SUB_TABS.reduce((acc, t) => acc + t.count, 0);

  const TOP_CATEGORIES = [
    { key: 'KMC' as TopCategory, label: 'KMC Services', count: KMC_COUNT },
    { key: 'CSC' as TopCategory, label: 'CSC Services', count: CSC_COUNT },
    {
      key: 'AapleSarkar' as TopCategory,
      label: 'Aaple Sarkar Services',
      count: AAPLE_SARKAR_COUNT,
    },
  ];

  const currentSubTabs =
    topCategory === 'KMC'
      ? KMC_SUB_TABS
      : topCategory === 'CSC'
        ? CSC_SUB_TABS
        : AAPLE_SARKAR_SUB_TABS;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '0.5rem' }}>
        <div className="page-title">Records</div>
      </div>

      {/* Top Level Category Tabs */}
      <div className="tab-bar" style={{ flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        {TOP_CATEGORIES.map(({ key, label, count }) => (
          <button
            key={key}
            className={`tab ${topCategory === key ? 'active' : ''}`}
            onClick={() => handleTopCategoryChange(key)}
          >
            {label}
            {count > 0 && (
              <span className="badge badge-blue" style={{ marginLeft: 6 }}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Sub tabs nested */}
      <div
        className="tab-bar"
        style={{
          flexWrap: 'wrap',
          background: 'var(--bg)',
          borderWidth: '2px',
          padding: '4px',
          scale: '0.95',
          transformOrigin: 'left center',
          marginBottom: '1.5rem',
        }}
      >
        {currentSubTabs.map(({ key, label, count }) => (
          <button
            key={key}
            className={`tab ${subTab === key ? 'active' : ''}`}
            onClick={() => setSubTab(key)}
            style={{ padding: '6px 10px', fontSize: '12px' }}
          >
            {label}
            {count > 0 && (
              <span
                className="badge badge-blue"
                style={{ marginLeft: 6, fontSize: '10px', padding: '2px 6px' }}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <FilterBar
        search={search}
        setSearch={setSearch}
        from={from}
        setFrom={setFrom}
        to={to}
        setTo={setTo}
        exportCurrent={exportCurrent}
        subTab={subTab}
        authorizerType={authorizerType}
        setAuthorizerType={setAuthorizerType}
      />

      {/* Unified Table */}
      <RecordsTable
        isLoading={isLoading}
        recordsList={recordsList as RecordTypeBySubTab<SubTab>[]}
        columns={COLUMNS_MAP[subTab] as never}
        currentPage={currentPage}
        PAGE_SIZE={PAGE_SIZE}
        totalPages={totalPages}
        totalCount={totalCount}
        setCurrentPage={setCurrentPage}
        onPrint={(r) => triggerPrint(subTab, r)}
        onEdit={(r) => setEditingRecord({ type: subTab, data: r })}
        onDelete={isAdmin ? (id) => deleteMutation.mutate({ type: subTab, id }) : undefined}
        onView={(r) => setViewingRecord({ type: subTab, data: r })}
        isAdmin={isAdmin}
      />

      {/* Dynamic Edit Modal */}
      {editingRecord && (
        <RecordEditModal
          type={editingRecord.type}
          record={editingRecord.data}
          onClose={() => setEditingRecord(null)}
          onSave={(data) =>
            updateMutation.mutate({ type: editingRecord.type, id: editingRecord.data.id, data })
          }
          saving={updateMutation.isPending}
        />
      )}

      {/* Dynamic View Detail Modal */}
      {viewingRecord && (
        <ViewRecordModal
          type={viewingRecord.type}
          record={viewingRecord.data}
          pricing={pricing}
          onClose={() => setViewingRecord(null)}
        />
      )}

      {/* Hidden print targets */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {printRecord &&
          (() => {
            const ReceiptComp = RECEIPT_MAP[printRecord.type] as React.ComponentType<{ record: unknown }> | undefined;
            return ReceiptComp ? (
              <div ref={receiptRef}>
                <ReceiptComp record={printRecord.data} />
              </div>
            ) : null;
          })()}
      </div>
    </div>
  );
}
