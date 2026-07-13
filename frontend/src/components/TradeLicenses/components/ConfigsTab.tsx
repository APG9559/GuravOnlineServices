import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tradeLicensesApi } from '@/api';
import NeoSelect from '@/components/NeoSelect';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/Modal';

const devanagariToEnglishMap: Record<string, string> = {
  '०': '0',
  '१': '1',
  '२': '2',
  '३': '3',
  '४': '4',
  '५': '5',
  '६': '6',
  '७': '7',
  '८': '8',
  '९': '9',
};

function normalizeDigitsForSorting(str: string): string {
  if (!str) return '';
  return str.replace(/[०-९]/g, (char) => devanagariToEnglishMap[char] || char);
}

export default function ConfigsTab() {
  const qc = useQueryClient();
  const { user, isAdmin } = useAuth();
  const hasConfigAccess = isAdmin || user?.role === 'operator';
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Queries
  const { data: configs = [], isLoading: configsLoading } = useQuery({
    queryKey: ['trade-configs'],
    queryFn: () => tradeLicensesApi.getConfigs().then((r) => r.data),
  });

  const filteredConfigs = configs.filter((c) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      c.tradeType.toLowerCase().includes(query) || c.tradeSubtype.toLowerCase().includes(query)
    );
  });

  // Unique trade types for select dropdown
  const uniqueTradeTypes = Array.from(new Set(configs.map((c) => c.tradeType))).sort((a, b) => {
    const aNorm = normalizeDigitsForSorting(a);
    const bNorm = normalizeDigitsForSorting(b);
    return aNorm.localeCompare(bNorm, undefined, { numeric: true });
  });

  // Sort configs by tradeType and tradeSubtype to ensure grouping
  const sortedConfigs = [...filteredConfigs].sort((a, b) => {
    const aTypeNorm = normalizeDigitsForSorting(a.tradeType);
    const bTypeNorm = normalizeDigitsForSorting(b.tradeType);
    const typeCompare = aTypeNorm.localeCompare(bTypeNorm, undefined, { numeric: true });

    if (typeCompare !== 0) return typeCompare;

    const aSubtypeNorm = normalizeDigitsForSorting(a.tradeSubtype);
    const bSubtypeNorm = normalizeDigitsForSorting(b.tradeSubtype);
    return aSubtypeNorm.localeCompare(bSubtypeNorm, undefined, { numeric: true });
  });

  // Precompute rows with rowSpan for merging cells
  const configRows: { config: (typeof configs)[0]; rowSpan?: number }[] = [];
  for (let i = 0; i < sortedConfigs.length; i++) {
    const current = sortedConfigs[i];
    if (i === 0 || sortedConfigs[i - 1].tradeType !== current.tradeType) {
      let count = 1;
      while (
        i + count < sortedConfigs.length &&
        sortedConfigs[i + count].tradeType === current.tradeType
      ) {
        count++;
      }
      configRows.push({ config: current, rowSpan: count });
    } else {
      configRows.push({ config: current });
    }
  }

  // Mutations
  const configMutation = useMutation({
    mutationFn: (data: {
      tradeType: string;
      tradeSubtype: string;
      licenseFee: number;
      fireFee: number;
      renewalFireFee: number;
    }) => tradeLicensesApi.createConfig(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trade-configs'] });
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: (data: {
      id: string;
      tradeType: string;
      tradeSubtype: string;
      licenseFee: number;
      fireFee: number;
      renewalFireFee: number;
    }) =>
      tradeLicensesApi
        .updateConfig(data.id, {
          tradeType: data.tradeType,
          tradeSubtype: data.tradeSubtype,
          licenseFee: data.licenseFee,
          fireFee: data.fireFee,
          renewalFireFee: data.renewalFireFee,
        })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trade-configs'] });
      cancelEdit();
    },
  });

  const deleteConfigMutation = useMutation({
    mutationFn: (id: string) => tradeLicensesApi.deleteConfig(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trade-configs'] });
    },
  });

  const startEdit = (config: import('@/types').TradeTypeConfig) => {
    setEditingConfigId(config.id);
    setIsNewCategoryMode(false);
    resetConfig({
      tradeTypeSelect: uniqueTradeTypes.includes(config.tradeType) ? config.tradeType : '',
      newTradeType: '',
      tradeSubtype: config.tradeSubtype,
      licenseFee: config.licenseFee,
      fireFee: config.fireFee || 0,
      renewalFireFee: config.renewalFireFee || 0,
    });
    setIsFormOpen(true);
  };

  const cancelEdit = () => {
    setEditingConfigId(null);
    setIsNewCategoryMode(false);
    resetConfig({
      tradeTypeSelect: '',
      newTradeType: '',
      tradeSubtype: '',
      licenseFee: 0,
      fireFee: 0,
      renewalFireFee: 0,
    });
    setIsFormOpen(false);
  };

  // Form
  const {
    register: registerConfig,
    handleSubmit: handleSubmitConfig,
    control: controlConfig,
    reset: resetConfig,
    formState: { errors: errorsConfig },
  } = useForm<{
    tradeTypeSelect: string;
    newTradeType?: string;
    tradeSubtype: string;
    licenseFee: number;
    fireFee: number;
    renewalFireFee: number;
  }>({
    defaultValues: {
      tradeTypeSelect: '',
      newTradeType: '',
      tradeSubtype: '',
      licenseFee: 0,
      fireFee: 0,
      renewalFireFee: 0,
    },
  });

  const onConfigSubmit = (data: {
    tradeTypeSelect: string;
    newTradeType?: string;
    tradeSubtype: string;
    licenseFee: number;
    fireFee: number;
    renewalFireFee: number;
  }) => {
    const tradeType =
      isNewCategoryMode || uniqueTradeTypes.length === 0
        ? data.newTradeType?.trim()
        : data.tradeTypeSelect;

    if (!tradeType) {
      alert('Please specify a trade category');
      return;
    }

    const fireFeeVal = Number(data.fireFee) || 0;
    const renewalFireFeeVal = Number(data.renewalFireFee) || 0;

    if (editingConfigId) {
      updateConfigMutation.mutate({
        id: editingConfigId,
        tradeType,
        tradeSubtype: data.tradeSubtype,
        licenseFee: Number(data.licenseFee),
        fireFee: fireFeeVal,
        renewalFireFee: renewalFireFeeVal,
      });
    } else {
      configMutation.mutate(
        {
          tradeType,
          tradeSubtype: data.tradeSubtype,
          licenseFee: Number(data.licenseFee),
          fireFee: fireFeeVal,
          renewalFireFee: renewalFireFeeVal,
        },
        {
          onSuccess: () => {
            resetConfig({
              tradeTypeSelect: '',
              newTradeType: '',
              tradeSubtype: '',
              licenseFee: 0,
              fireFee: 0,
              renewalFireFee: 0,
            });
            setIsFormOpen(false);
          },
        },
      );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* List panel */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ fontWeight: 500 }}>Trade License Fee Chart</div>
          {hasConfigAccess && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setEditingConfigId(null);
                  setIsNewCategoryMode(true);
                  resetConfig({
                    tradeTypeSelect: '',
                    newTradeType: '',
                    tradeSubtype: '',
                    licenseFee: 0,
                    fireFee: 0,
                    renewalFireFee: 0,
                  });
                  setIsFormOpen(true);
                }}
              >
                + Add New Trade
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setEditingConfigId(null);
                  setIsNewCategoryMode(false);
                  resetConfig({
                    tradeTypeSelect: '',
                    newTradeType: '',
                    tradeSubtype: '',
                    licenseFee: 0,
                    fireFee: 0,
                    renewalFireFee: 0,
                  });
                  setIsFormOpen(true);
                }}
              >
                + Add Subtrade
              </button>
            </div>
          )}
        </div>
        {/* Search Bar */}
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
          <input
            className="search-input"
            style={{ width: '100%', margin: 0 }}
            placeholder="Search by Trade or Subtrade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {configsLoading ? (
          <div style={{ padding: 20 }}>Loading...</div>
        ) : configs.length === 0 ? (
          <div style={{ padding: 20, color: 'var(--text-muted)' }}>
            No configurations set up. Please add one.
          </div>
        ) : filteredConfigs.length === 0 ? (
          <div style={{ padding: 20, color: 'var(--text-muted)' }}>
            No matching configurations found.
          </div>
        ) : (
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Trade </th>
                  <th>Subtrade</th>
                  <th>License Fee</th>
                  <th>Fire Fee</th>
                  <th>Renewal Fire Fee</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {configRows.map(({ config: c, rowSpan }) => (
                  <tr key={c.id}>
                    {rowSpan !== undefined && (
                      <td rowSpan={rowSpan} style={{ fontWeight: 500, verticalAlign: 'middle' }}>
                        {c.tradeType}
                      </td>
                    )}
                    <td>{c.tradeSubtype}</td>
                    <td>₹{c.licenseFee}</td>
                    <td>{c.fireFee && Number(c.fireFee) > 0 ? `₹${c.fireFee}` : '-'}</td>
                    <td>
                      {c.renewalFireFee && Number(c.renewalFireFee) > 0
                        ? `₹${c.renewalFireFee}`
                        : '-'}
                    </td>
                    <td>
                      {hasConfigAccess && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-sm"
                            style={{ padding: '2px 8px', fontSize: 11 }}
                            onClick={() => startEdit(c)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            style={{ padding: '2px 8px', fontSize: 11 }}
                            disabled={deleteConfigMutation.isPending}
                            onClick={() => {
                              if (
                                confirm(
                                  `Remove configuration for ${c.tradeType} - ${c.tradeSubtype}?`,
                                )
                              ) {
                                deleteConfigMutation.mutate(c.id);
                              }
                            }}
                          >
                            Del
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isFormOpen && (
        <Modal
          title={
            editingConfigId ? 'Edit Subtrade' : isNewCategoryMode ? 'Add New Trade' : 'Add Subtrade'
          }
          onClose={cancelEdit}
        >
          {configMutation.isSuccess && (
            <div className="alert-success" style={{ marginBottom: 12 }}>
              Config rate added successfully!
            </div>
          )}
          {configMutation.isError && (
            <div className="alert-error" style={{ marginBottom: 12 }}>
              Failed to add config. Already exists?
            </div>
          )}
          {updateConfigMutation.isSuccess && (
            <div className="alert-success" style={{ marginBottom: 12 }}>
              Config rate updated successfully!
            </div>
          )}
          {updateConfigMutation.isError && (
            <div className="alert-error" style={{ marginBottom: 12 }}>
              Failed to update config.
            </div>
          )}

          <form onSubmit={handleSubmitConfig(onConfigSubmit)}>
            {!isNewCategoryMode && uniqueTradeTypes.length > 0 ? (
              <div className="form-group">
                <label>Trade Type Category *</label>
                <Controller
                  control={controlConfig}
                  name="tradeTypeSelect"
                  rules={{ required: !isNewCategoryMode && uniqueTradeTypes.length > 0 }}
                  render={({ field: { value, onChange } }) => (
                    <NeoSelect
                      value={value}
                      onChange={onChange}
                      options={[
                        { value: '', label: 'Select Existing Category' },
                        ...uniqueTradeTypes.map((t) => ({ value: t, label: t })),
                      ]}
                      placeholder="Choose Category"
                      searchable={true}
                    />
                  )}
                />
                {errorsConfig.tradeTypeSelect && <span className="error-text">Required</span>}
              </div>
            ) : (
              <div className="form-group">
                <label>Trade Type Category *</label>
                <input
                  {...registerConfig('newTradeType', {
                    required: isNewCategoryMode || uniqueTradeTypes.length === 0,
                  })}
                  placeholder="e.g. Food, Industry, Logistics"
                />
                {errorsConfig.newTradeType && <span className="error-text">Required</span>}
              </div>
            )}

            <div className="form-group">
              <label>Trade Subtype *</label>
              <input
                {...registerConfig('tradeSubtype', { required: true })}
                placeholder="e.g. Restaurant, Bakery, Warehouse"
              />
              {errorsConfig.tradeSubtype && <span className="error-text">Required</span>}
            </div>

            <div className="form-group">
              <label>License Fee (₹) *</label>
              <input
                type="number"
                {...registerConfig('licenseFee', { required: true, valueAsNumber: true, min: 0 })}
                placeholder="Official government fee"
              />
              {errorsConfig.licenseFee && <span className="error-text">Required (Min 0)</span>}
            </div>

            <div className="form-group">
              <label>Fire Fee (₹) *</label>
              <input
                type="number"
                {...registerConfig('fireFee', { required: true, valueAsNumber: true, min: 0 })}
                placeholder="New application fire fee"
              />
              {errorsConfig.fireFee && <span className="error-text">Required (Min 0)</span>}
            </div>

            <div className="form-group">
              <label>Renewal Fire Fee (₹) *</label>
              <input
                type="number"
                {...registerConfig('renewalFireFee', {
                  required: true,
                  valueAsNumber: true,
                  min: 0,
                })}
                placeholder="Renewal application fire fee"
              />
              {errorsConfig.renewalFireFee && <span className="error-text">Required (Min 0)</span>}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={configMutation.isPending || updateConfigMutation.isPending}
              >
                {configMutation.isPending || updateConfigMutation.isPending
                  ? 'Saving...'
                  : editingConfigId
                    ? 'Save Changes'
                    : 'Add Configuration Rate'}
              </button>
              {editingConfigId && (
                <button className="btn" type="button" onClick={cancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
