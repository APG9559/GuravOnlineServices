import { useState, useRef } from 'react';
import { useAppPrint } from '@/hooks/useAppPrint';
import { WaterConnection, WaterServiceRecord } from '@/types';
import { WaterSupplyReceipt } from '@/components/ReceiptModal/Receipt';
import ServiceFormsTab from '@/components/WaterSupplies/ServiceFormsTab';
import ConnectionsListTab from '@/components/WaterSupplies/ConnectionsListTab';
import ServiceLogsTab from '@/components/WaterSupplies/ServiceLogsTab';
import ConfigsTab from '@/components/WaterSupplies/ConfigsTab';

export default function WaterSupplyPage() {
  const [activeTab, setActiveTab] = useState<'forms' | 'connections' | 'logs' | 'configs'>('forms');
  const [selectedServiceType, setSelectedServiceType] = useState<WaterServiceRecord['serviceType']>('NewConnection');
  const [selectedConnection, setSelectedConnection] = useState<WaterConnection | null>(null);
  const [savedRecord, setSavedRecord] = useState<WaterServiceRecord | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const receiptRef = useRef<HTMLDivElement>(null);
  const handlePrint = useAppPrint({ content: () => receiptRef.current });

  const startServiceForConnection = (conn: WaterConnection, serviceType: WaterServiceRecord['serviceType']) => {
    setSelectedConnection(conn);
    setSelectedServiceType(serviceType);
    setActiveTab('forms');
  };

  const onRecordSaved = (record: WaterServiceRecord) => {
    setSavedRecord(record);
    setShowSuccessModal(true);
  };

  const onPrintTrigger = (record: WaterServiceRecord) => {
    setSavedRecord(record);
    setTimeout(handlePrint, 100);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Water Supply Module</div>
      </div>

      {/* Main Tab bar */}
      <div className="tab-bar" style={{ flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {[
          { key: 'forms', label: 'Service Forms' },
          { key: 'connections', label: 'Connections List' },
          { key: 'logs', label: 'Service Logs' },
          { key: 'configs', label: 'Water Configs' },
        ].map((t) => (
          <button
            key={t.key}
            className={`tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(t.key as any);
              setSavedRecord(null); // clear printed receipt indicator
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'forms' && (
        <div className="card" style={{ maxWidth: 800 }}>
          <div style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.1rem', textTransform: 'uppercase' }}>
            New Water Supply Application or Transaction
          </div>
          <ServiceFormsTab
            selectedServiceType={selectedServiceType}
            setSelectedServiceType={setSelectedServiceType}
            selectedConnection={selectedConnection}
            setSelectedConnection={setSelectedConnection}
            onRecordSaved={onRecordSaved}
          />
        </div>
      )}

      {activeTab === 'connections' && (
        <ConnectionsListTab
          startServiceForConnection={startServiceForConnection}
        />
      )}

      {activeTab === 'logs' && (
        <ServiceLogsTab
          onPrint={onPrintTrigger}
        />
      )}

      {activeTab === 'configs' && (
        <ConfigsTab />
      )}

      {/* Hidden print targets */}
      {savedRecord && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <WaterSupplyReceipt ref={receiptRef} record={savedRecord} />
        </div>
      )}

      {/* Success Popup Modal */}
      {showSuccessModal && savedRecord && (
        <div style={{
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
        }}>
          <div className="card" style={{
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
          }}>
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
            <div style={{
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
            }}>
              ✓
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 'bold' }}>Record Saved!</h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted)', fontSize: 14 }}>
              The water supply service transaction has been successfully registered.
            </p>

            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={() => {
                  handlePrint();
                }}
              >
                🖨 Print Receipt
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
    </div>
  );
}
