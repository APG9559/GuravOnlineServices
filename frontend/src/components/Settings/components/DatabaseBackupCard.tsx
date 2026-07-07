import React from 'react';

interface DatabaseBackupCardProps {
  isAdmin: boolean;
  exporting: boolean;
  handleExportDatabase: () => Promise<void>;
  importing: boolean;
  importMode: 'full' | 'insert';
  setImportMode: (mode: 'full' | 'insert') => void;
  importFile: File | null;
  setImportFile: (file: File | null) => void;
  handleImportDatabase: () => Promise<void>;
  showRestoreConfirm: boolean;
  setShowRestoreConfirm: (show: boolean) => void;
  restoreConfirmText: string;
  setRestoreConfirmText: (text: string) => void;
  restoreConfirmChecked: boolean;
  setRestoreConfirmChecked: (val: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  clearing: boolean;
  showClearConfirm: boolean;
  setShowClearConfirm: (show: boolean) => void;
  clearConfirmText: string;
  setClearConfirmText: (text: string) => void;
  clearConfirmChecked: boolean;
  setClearConfirmChecked: (val: boolean) => void;
  handleClearDatabase: () => Promise<void>;
}

export default function DatabaseBackupCard({
  isAdmin,
  exporting,
  handleExportDatabase,
  importing,
  importMode,
  setImportMode,
  importFile,
  setImportFile,
  handleImportDatabase,
  showRestoreConfirm,
  setShowRestoreConfirm,
  restoreConfirmText,
  setRestoreConfirmText,
  restoreConfirmChecked,
  setRestoreConfirmChecked,
  fileInputRef,
  clearing,
  showClearConfirm,
  setShowClearConfirm,
  clearConfirmText,
  setClearConfirmText,
  clearConfirmChecked,
  setClearConfirmChecked,
  handleClearDatabase,
}: DatabaseBackupCardProps) {
  if (!isAdmin) return null;

  return (
    <>
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div style={{ fontWeight: 500, fontSize: 15, marginBottom: '0.5rem' }}>
          Database Administration
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Export your entire database, import files from backup, or wipe transactional data tables.
        </div>

        {/* Database Export Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>Export Database</div>
          <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 12 }}>
            Downloads a custom binary PostgreSQL dump (`.dump`) containing all data tables, schema rules, and configuration values.
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleExportDatabase}
            disabled={exporting}
          >
            {exporting ? 'Exporting Database…' : 'Export DB Binary Dump'}
          </button>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(24,95,165,0.15)', margin: '1.5rem 0' }} />

        {/* Database Import Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>Import / Restore Database</div>
          <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 12 }}>
            Upload a valid database dump file to load records.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 450 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="radio"
                  name="import-mode"
                  checked={importMode === 'insert'}
                  onChange={() => setImportMode('insert')}
                />
                Merge (Add records only)
              </label>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="radio"
                  name="import-mode"
                  checked={importMode === 'full'}
                  onChange={() => setImportMode('full')}
                />
                Full Restore (Wipe & overwrite)
              </label>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".dump"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              style={{ fontSize: 12 }}
            />

            <button
              className="btn btn-primary btn-sm"
              onClick={handleImportDatabase}
              disabled={importing || !importFile}
              style={{ width: 'fit-content' }}
            >
              {importing ? 'Importing…' : 'Start Restore'}
            </button>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(24,95,165,0.15)', margin: '1.5rem 0' }} />

        {/* Database Wipe Section */}
        <div>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4, color: 'var(--danger)' }}>Wipe Transactional Data</div>
          <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 12 }}>
            Clears all customer records, marriages, affidavits, property cards, shop licenses, etc. User accounts, settings, and logs are preserved.
          </div>
          <button
            className="btn btn-secondary btn-sm"
            style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.35)' }}
            onClick={handleClearDatabase}
            disabled={clearing}
          >
            {clearing ? 'Clearing Tables…' : 'Wipe Data Tables'}
          </button>
        </div>
      </div>

      {/* Full Restore Confirmation Modal */}
      {showRestoreConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div className="card" style={{ maxWidth: 450, width: '100%', border: '2px solid var(--danger)' }}>
            <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--danger)', marginBottom: 12 }}>
              ⚠️ CRITICAL WARNING: Destructive Full Restore
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
              You are about to perform a **Full Restore**. This action will permanently delete all existing transactional records and configurations, then replace them with the uploaded backup.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
                Type <strong style={{ color: 'var(--text)' }}>"RESTORE DATABASE"</strong> to confirm:
              </label>
              <input
                type="text"
                placeholder="Type here..."
                value={restoreConfirmText}
                onChange={(e) => setRestoreConfirmText(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div className="checkbox-row" style={{ marginBottom: 20 }}>
              <input
                type="checkbox"
                id="c-restore-check"
                checked={restoreConfirmChecked}
                onChange={(e) => setRestoreConfirmChecked(e.target.checked)}
              />
              <label htmlFor="c-restore-check" style={{ fontSize: 13, color: 'var(--text)' }}>
                I understand this operation is destructive and cannot be undone.
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className="btn"
                onClick={() => {
                  setShowRestoreConfirm(false);
                  setRestoreConfirmText('');
                  setRestoreConfirmChecked(false);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
                disabled={restoreConfirmText !== 'RESTORE DATABASE' || !restoreConfirmChecked || importing}
                onClick={handleImportDatabase}
              >
                {importing ? 'Restoring…' : 'Overwrite Database'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Database Confirmation Modal */}
      {showClearConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div className="card" style={{ maxWidth: 450, width: '100%', border: '2px solid var(--danger)' }}>
            <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--danger)', marginBottom: 12 }}>
              ⚠️ CRITICAL WARNING: Wipe All Transactional Data
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
              This will permanently delete all customer files, marriages, affidavits, water supply logs, and invoices. User accounts and login credentials are not deleted.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
                Type <strong style={{ color: 'var(--text)' }}>"DELETE ALL RECORDS"</strong> to confirm:
              </label>
              <input
                type="text"
                placeholder="Type here..."
                value={clearConfirmText}
                onChange={(e) => setClearConfirmText(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div className="checkbox-row" style={{ marginBottom: 20 }}>
              <input
                type="checkbox"
                id="c-clear-check"
                checked={clearConfirmChecked}
                onChange={(e) => setClearConfirmChecked(e.target.checked)}
              />
              <label htmlFor="c-clear-check" style={{ fontSize: 13, color: 'var(--text)' }}>
                I understand this wipes all transaction records and cannot be undone.
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className="btn"
                onClick={() => {
                  setShowClearConfirm(false);
                  setClearConfirmText('');
                  setClearConfirmChecked(false);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
                disabled={clearConfirmText !== 'DELETE ALL RECORDS' || !clearConfirmChecked || clearing}
                onClick={handleClearDatabase}
              >
                {clearing ? 'Clearing…' : 'Wipe Data Tables'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
