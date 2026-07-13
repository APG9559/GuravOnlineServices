import { useState, useRef } from 'react';
import { useAppPrint } from '@/hooks/useAppPrint';
import { TradeLicenseRecord, Business } from '@/types';
import { TradeLicenseReceipt } from '@/components/ReceiptModal/Receipt';
import ServiceFormsTab from '@/components/TradeLicenses/components/ServiceFormsTab';
import BusinessesListTab from '@/components/TradeLicenses/components/BusinessesListTab';
import RenewalQueueTab from '@/components/TradeLicenses/components/RenewalQueueTab';
import ServiceLogsTab from '@/components/TradeLicenses/components/ServiceLogsTab';
import ConfigsTab from '@/components/TradeLicenses/components/ConfigsTab';
import ShareReceiptModal from '@/components/TradeLicenses/components/ShareReceiptModal';

export default function TradeLicensesPage() {
  const [activeTab, setActiveTab] = useState<
    'forms' | 'businesses' | 'renewal' | 'logs' | 'configs'
  >('forms');
  const [selectedServiceType, setSelectedServiceType] =
    useState<TradeLicenseRecord['serviceType']>('New');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [savedRecord, setSavedRecord] = useState<TradeLicenseRecord | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const receiptRef = useRef<HTMLDivElement>(null);
  const handlePrint = useAppPrint({ content: () => receiptRef.current });

  const startServiceForBusiness = (biz: Business, service: TradeLicenseRecord['serviceType']) => {
    setSelectedBusiness(biz);
    setSelectedServiceType(service);
    setActiveTab('forms');
  };

  const onRecordSaved = (record: TradeLicenseRecord) => {
    setSavedRecord(record);
    setShowSuccessModal(true);
  };

  const onPrintTrigger = (record: TradeLicenseRecord) => {
    setSavedRecord(record);
    setTimeout(handlePrint, 100);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Trade License Module</div>
      </div>

      {/* Main Tab bar */}
      <div className="tab-bar" style={{ flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {([
          { key: 'forms', label: 'Service Forms' },
          { key: 'businesses', label: 'Businesses List' },
          { key: 'renewal', label: 'Renewal Queue' },
          { key: 'logs', label: 'Service Logs' },
          { key: 'configs', label: 'Trade Configs' },
        ] as const).map((t) => (
          <button
            key={t.key}
            className={`tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(t.key);
              setSavedRecord(null); // clear printed receipt indicator
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'forms' && (
        <ServiceFormsTab
          selectedServiceType={selectedServiceType}
          setSelectedServiceType={setSelectedServiceType}
          selectedBusiness={selectedBusiness}
          setSelectedBusiness={setSelectedBusiness}
          onRecordSaved={onRecordSaved}
        />
      )}

      {activeTab === 'businesses' && (
        <BusinessesListTab startServiceForBusiness={startServiceForBusiness} />
      )}

      {activeTab === 'renewal' && (
        <RenewalQueueTab startServiceForBusiness={startServiceForBusiness} />
      )}

      {activeTab === 'logs' && <ServiceLogsTab onPrint={onPrintTrigger} />}

      {activeTab === 'configs' && <ConfigsTab />}

      {/* Hidden print targets */}
      {savedRecord && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <TradeLicenseReceipt ref={receiptRef} record={savedRecord} />
        </div>
      )}

      {/* Success Popup Modal */}
      {showSuccessModal && savedRecord && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 400,
              width: '100%',
              backgroundColor: 'var(--surface)',
              position: 'relative',
              textAlign: 'center',
              padding: '28px 24px',
              boxShadow: '6px 6px 0px var(--border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'var(--text)',
            }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                setSavedRecord(null);
              }}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'none',
                border: 'none',
                fontSize: 18,
                fontWeight: 'bold',
                cursor: 'pointer',
                color: 'var(--text)',
              }}
            >
              ✕
            </button>

            {/* Checkmark Icon */}
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                border: '3.5px solid var(--border)',
                background: '#2ecc71',
                boxShadow: '3px 3px 0px var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 'bold',
                color: '#000000',
                marginBottom: 16,
              }}
            >
              ✓
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 'bold' }}>Record Saved!</h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted)', fontSize: 14 }}>
              The trade license transaction has been successfully registered.
            </p>

            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button
                className="btn btn-primary"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
                onClick={() => {
                  handlePrint();
                }}
              >
                🖨 Print Receipt
              </button>
              <button
                className="btn btn-success-soft"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
                onClick={() => {
                  setShowSuccessModal(false);
                  setShowShareModal(true);
                }}
              >
                💬 Share
              </button>
              <button
                className="btn"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowSuccessModal(false);
                  setSavedRecord(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && savedRecord && (
        <ShareReceiptModal
          record={savedRecord}
          onClose={() => {
            setShowShareModal(false);
            setSavedRecord(null);
          }}
        />
      )}
    </div>
  );
}
