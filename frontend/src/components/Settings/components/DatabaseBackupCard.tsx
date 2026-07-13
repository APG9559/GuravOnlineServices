import React from 'react';
import type { SyncExportHook, SyncTableCategory } from '@/components/Settings/hooks/useSyncExport';
import type { SyncImportHook } from '@/components/Settings/hooks/useSyncImport';

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
  syncExport: SyncExportHook;
  syncImport: SyncImportHook;
}

function formatTableName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
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
  syncExport,
  syncImport,
}: DatabaseBackupCardProps) {
  if (!isAdmin) return null;

  const allSelectedInCategory = (cat: SyncTableCategory) =>
    cat.tables.every((t) => syncExport.selectedTables.has(t));

  return (
    <>
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div style={{ fontWeight: 500, fontSize: 15, marginBottom: '0.5rem' }}>
          Database Administration
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Export your entire database, import files from backup, wipe transactional data tables, or
          sync selected records using portable JSON.
        </div>

        {/* Smart JSON Sync Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>Smart JSON Sync</div>
          <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 12 }}>
            Export selected records as a portable JSON file and import them into another environment
            without database dump tools.
          </div>

          {/* Category-based table selection */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={syncExport.selectAll}
                style={{ fontSize: 12 }}
              >
                Select All
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={syncExport.deselectAll}
                style={{ fontSize: 12 }}
              >
                Deselect All
              </button>
            </div>
            {syncExport.categories.map((cat) => (
              <div key={cat.label} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{cat.label}</span>
                  <button
                    className="btn btn-link btn-sm"
                    onClick={() => syncExport.toggleCategory(cat, !allSelectedInCategory(cat))}
                    style={{ fontSize: 11, padding: 0, textDecoration: 'underline' }}
                  >
                    {allSelectedInCategory(cat) ? 'Deselect all' : 'Select all'}
                  </button>
                  <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>
                    {cat.tables.filter((t) => syncExport.selectedTables.has(t)).length}/
                    {cat.tables.length}
                  </span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: 6,
                  }}
                >
                  {cat.tables.map((table) => (
                    <label
                      key={table}
                      style={{
                        display: 'flex',
                        gap: 6,
                        alignItems: 'center',
                        cursor: 'pointer',
                        fontSize: 12,
                        lineHeight: 1.3,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={syncExport.selectedTables.has(table)}
                        onChange={() => syncExport.toggleTable(table)}
                      />
                      {formatTableName(table)}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={syncExport.exportSyncFile}
            disabled={syncExport.exporting}
          >
            {syncExport.exporting ? 'Exporting…' : 'Export Sync File'}
          </button>
        </div>

        {/* Sync Import Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>Import Sync File</div>
          <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 12 }}>
            Upload a JSON sync file, preview the target insert/skip counts, and then import records.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 500 }}>
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => syncImport.updateFile(e.target.files?.[0] || null)}
              style={{ fontSize: 12 }}
            />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={syncImport.previewSyncFile}
                disabled={syncImport.previewing || !syncImport.file}
              >
                {syncImport.previewing ? 'Previewing…' : 'Preview File'}
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={syncImport.importSyncFile}
                disabled={syncImport.importing || !syncImport.file}
              >
                {syncImport.importing ? 'Importing…' : 'Import Sync File'}
              </button>
            </div>
            {syncImport.error && (
              <div style={{ color: 'var(--danger)', fontSize: 12 }}>{syncImport.error}</div>
            )}
            {syncImport.preview && (
              <div
                style={{
                  background: 'rgba(24,95,165,0.05)',
                  border: '1px solid rgba(24,95,165,0.15)',
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Preview</div>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 100px 100px',
                      gap: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    <div>Table</div>
                    <div>New</div>
                    <div>Existing</div>
                  </div>
                  {syncImport.preview.summary.map((row) => (
                    <div
                      key={row.table}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 100px 100px',
                        gap: 10,
                        fontSize: 13,
                        padding: '4px 0',
                      }}
                    >
                      <div>{formatTableName(row.table)}</div>
                      <div>{row.toInsert}</div>
                      <div>{row.alreadyExist}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                  {syncImport.preview.totalErrors > 0
                    ? `${syncImport.preview.totalErrors} error(s) detected. Fix the file or check the preview before importing.`
                    : `${syncImport.preview.totalNew} new, ${syncImport.preview.totalSkipped} skipped`}
                </div>
              </div>
            )}
          </div>
        </div>

        <hr
          style={{
            border: 'none',
            borderTop: '1px solid rgba(24,95,165,0.15)',
            margin: '1.5rem 0',
          }}
        />

        {/* Database Export Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>Export Database</div>
          <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 12 }}>
            Downloads a custom binary PostgreSQL dump (`.dump`) containing all data tables, schema
            rules, and configuration values.
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleExportDatabase}
            disabled={exporting}
          >
            {exporting ? 'Exporting Database…' : 'Export DB Binary Dump'}
          </button>
        </div>

        <hr
          style={{
            border: 'none',
            borderTop: '1px solid rgba(24,95,165,0.15)',
            margin: '1.5rem 0',
          }}
        />

        {/* Database Import Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>
            Import / Restore Database
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 12 }}>
            Upload a valid database dump file to load records.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 450 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <label
                style={{
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                <input
                  type="radio"
                  name="import-mode"
                  checked={importMode === 'insert'}
                  onChange={() => setImportMode('insert')}
                />
                Merge (Add records only)
              </label>
              <label
                style={{
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
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

        <hr
          style={{
            border: 'none',
            borderTop: '1px solid rgba(24,95,165,0.15)',
            margin: '1.5rem 0',
          }}
        />

        {/* Database Wipe Section */}
        <div>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4, color: 'var(--danger)' }}>
            Wipe Transactional Data
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 12 }}>
            Clears all customer records, marriages, affidavits, property cards, shop licenses, etc.
            User accounts, settings, and logs are preserved.
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
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            className="card"
            style={{ maxWidth: 450, width: '100%', border: '2px solid var(--danger)' }}
          >
            <div
              style={{ fontWeight: 600, fontSize: 16, color: 'var(--danger)', marginBottom: 12 }}
            >
              ⚠️ CRITICAL WARNING: Destructive Full Restore
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
              You are about to perform a **Full Restore**. This action will permanently delete all
              existing transactional records and configurations, then replace them with the uploaded
              backup.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
                Type <strong style={{ color: 'var(--text)' }}>"RESTORE DATABASE"</strong> to
                confirm:
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
                disabled={
                  restoreConfirmText !== 'RESTORE DATABASE' || !restoreConfirmChecked || importing
                }
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
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            className="card"
            style={{ maxWidth: 450, width: '100%', border: '2px solid var(--danger)' }}
          >
            <div
              style={{ fontWeight: 600, fontSize: 16, color: 'var(--danger)', marginBottom: 12 }}
            >
              ⚠️ CRITICAL WARNING: Wipe All Transactional Data
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
              This will permanently delete all customer files, marriages, affidavits, water supply
              logs, and invoices. User accounts and login credentials are not deleted.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
                Type <strong style={{ color: 'var(--text)' }}>"DELETE ALL RECORDS"</strong> to
                confirm:
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
                disabled={
                  clearConfirmText !== 'DELETE ALL RECORDS' || !clearConfirmChecked || clearing
                }
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
