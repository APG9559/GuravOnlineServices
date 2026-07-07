import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tradeLicensesApi } from '@/api';
import NeoSelect from '@/components/NeoSelect';
import { useAuth } from '@/context/AuthContext';

export default function ConfigsTab() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);

  // Queries
  const { data: configs = [], isLoading: configsLoading } = useQuery({
    queryKey: ['trade-configs'],
    queryFn: () => tradeLicensesApi.getConfigs().then((r) => r.data),
  });

  // Unique trade types for select dropdown
  const uniqueTradeTypes = Array.from(new Set(configs.map((c) => c.tradeType)));

  // Sort configs by tradeType and tradeSubtype to ensure grouping
  const sortedConfigs = [...configs].sort((a, b) => {
    const typeCompare = a.tradeType.localeCompare(b.tradeType);
    if (typeCompare !== 0) return typeCompare;
    return a.tradeSubtype.localeCompare(b.tradeSubtype);
  });

  // Precompute rows with rowSpan for merging cells
  const configRows: { config: typeof configs[0]; rowSpan?: number }[] = [];
  for (let i = 0; i < sortedConfigs.length; i++) {
    const current = sortedConfigs[i];
    if (i === 0 || sortedConfigs[i - 1].tradeType !== current.tradeType) {
      let count = 1;
      while (i + count < sortedConfigs.length && sortedConfigs[i + count].tradeType === current.tradeType) {
        count++;
      }
      configRows.push({ config: current, rowSpan: count });
    } else {
      configRows.push({ config: current });
    }
  }

  // Mutations
  const configMutation = useMutation({
    mutationFn: (data: { tradeType: string; tradeSubtype: string; officialFee: number; fireFee: number; renewalFireFee: number }) =>
      tradeLicensesApi.createConfig(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trade-configs'] });
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: (data: { id: string; tradeType: string; tradeSubtype: string; officialFee: number; fireFee: number; renewalFireFee: number }) =>
      tradeLicensesApi.updateConfig(data.id, {
        tradeType: data.tradeType,
        tradeSubtype: data.tradeSubtype,
        officialFee: data.officialFee,
        fireFee: data.fireFee,
        renewalFireFee: data.renewalFireFee,
      }).then((r) => r.data),
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
    const hasFire = Boolean(config.fireFee && Number(config.fireFee) > 0) || Boolean(config.renewalFireFee && Number(config.renewalFireFee) > 0);
    resetConfig({
      tradeTypeSelect: uniqueTradeTypes.includes(config.tradeType) ? config.tradeType : '__NEW__',
      newTradeType: config.tradeType,
      tradeSubtype: config.tradeSubtype,
      officialFee: config.officialFee,
      hasFireFee: hasFire,
      fireFee: config.fireFee || 0,
      renewalFireFee: config.renewalFireFee || 0,
    });
  };

  const cancelEdit = () => {
    setEditingConfigId(null);
    resetConfig({
      tradeTypeSelect: '',
      newTradeType: '',
      tradeSubtype: '',
      officialFee: 0,
      hasFireFee: false,
      fireFee: 0,
      renewalFireFee: 0,
    });
  };

  // Form
  const {
    register: registerConfig,
    handleSubmit: handleSubmitConfig,
    control: controlConfig,
    watch: watchConfig,
    reset: resetConfig,
    formState: { errors: errorsConfig },
  } = useForm<{
    tradeTypeSelect: string;
    newTradeType?: string;
    tradeSubtype: string;
    officialFee: number;
    hasFireFee: boolean;
    fireFee: number;
    renewalFireFee: number;
  }>({
    defaultValues: {
      tradeTypeSelect: '',
      newTradeType: '',
      tradeSubtype: '',
      officialFee: 0,
      hasFireFee: false,
      fireFee: 0,
      renewalFireFee: 0,
    },
  });

  const configTradeTypeSelectWatch = watchConfig('tradeTypeSelect');
  const hasFireFeeWatch = watchConfig('hasFireFee');

  const onConfigSubmit = (data: {
    tradeTypeSelect: string;
    newTradeType?: string;
    tradeSubtype: string;
    officialFee: number;
    hasFireFee: boolean;
    fireFee: number;
    renewalFireFee: number;
  }) => {
    const tradeType = (data.tradeTypeSelect === '__NEW__' || uniqueTradeTypes.length === 0)
      ? data.newTradeType?.trim()
      : data.tradeTypeSelect;

    if (!tradeType) {
      alert('Please specify a trade category');
      return;
    }

    const fireFeeVal = data.hasFireFee ? Number(data.fireFee) : 0;
    const renewalFireFeeVal = data.hasFireFee ? Number(data.renewalFireFee) : 0;

    if (editingConfigId) {
      updateConfigMutation.mutate({
        id: editingConfigId,
        tradeType,
        tradeSubtype: data.tradeSubtype,
        officialFee: Number(data.officialFee),
        fireFee: fireFeeVal,
        renewalFireFee: renewalFireFeeVal,
      });
    } else {
      configMutation.mutate(
        {
          tradeType,
          tradeSubtype: data.tradeSubtype,
          officialFee: Number(data.officialFee),
          fireFee: fireFeeVal,
          renewalFireFee: renewalFireFeeVal,
        },
        {
          onSuccess: () => {
            resetConfig({
              tradeTypeSelect: '',
              newTradeType: '',
              tradeSubtype: '',
              officialFee: 0,
              hasFireFee: false,
              fireFee: 0,
              renewalFireFee: 0,
            });
          },
        }
      );
    }
  };

  return (
    <div className="grid-2">
      {/* List panel */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>
          Existing Trade Config Rates
        </div>
        {configsLoading ? (
          <div style={{ padding: 20 }}>Loading...</div>
        ) : configs.length === 0 ? (
          <div style={{ padding: 20, color: 'var(--text-muted)' }}>No configurations set up. Please add one.</div>
        ) : (
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Trade Category</th>
                  <th>Subtype</th>
                  <th>Official Fee</th>
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
                    <td>₹{c.officialFee}</td>
                    <td>{c.fireFee && Number(c.fireFee) > 0 ? `₹${c.fireFee}` : '-'}</td>
                    <td>{c.renewalFireFee && Number(c.renewalFireFee) > 0 ? `₹${c.renewalFireFee}` : '-'}</td>
                    <td>
                      {isAdmin && (
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
                              if (confirm(`Remove configuration for ${c.tradeType} - ${c.tradeSubtype}?`)) {
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

      {/* Add panel */}
      <div className="card" style={{ height: 'fit-content' }}>
        <div style={{ fontWeight: 500, fontSize: 15, marginBottom: '1rem' }}>
          {editingConfigId ? 'Edit Trade Type Fee Configuration' : 'Add Trade Type Fee Configuration'}
        </div>

        {configMutation.isSuccess && (
          <div className="alert-success" style={{ marginBottom: 12 }}>Config rate added successfully!</div>
        )}
        {configMutation.isError && (
          <div className="alert-error" style={{ marginBottom: 12 }}>Failed to add config. Already exists?</div>
        )}
        {updateConfigMutation.isSuccess && (
          <div className="alert-success" style={{ marginBottom: 12 }}>Config rate updated successfully!</div>
        )}
        {updateConfigMutation.isError && (
          <div className="alert-error" style={{ marginBottom: 12 }}>Failed to update config.</div>
        )}

        <form onSubmit={handleSubmitConfig(onConfigSubmit)}>
          {uniqueTradeTypes.length > 0 && (
            <div className="form-group">
              <label>Trade Type Category *</label>
              <Controller
                control={controlConfig}
                name="tradeTypeSelect"
                rules={{ required: uniqueTradeTypes.length > 0 }}
                render={({ field: { value, onChange } }) => (
                  <NeoSelect
                    value={value}
                    onChange={onChange}
                    options={[
                      { value: '', label: 'Select Existing Category' },
                      { value: '__NEW__', label: '+ Create New Category...' },
                      ...uniqueTradeTypes.map((t) => ({ value: t, label: t })),
                    ]}
                    placeholder="Choose Category or New"
                  />
                )}
              />
              {errorsConfig.tradeTypeSelect && <span className="error-text">Required</span>}
            </div>
          )}

          {(uniqueTradeTypes.length === 0 || configTradeTypeSelectWatch === '__NEW__') && (
            <div className="form-group">
              <label>{uniqueTradeTypes.length > 0 ? 'New Category Name *' : 'Trade Type Category *'}</label>
              <input
                {...registerConfig('newTradeType', { required: uniqueTradeTypes.length === 0 || configTradeTypeSelectWatch === '__NEW__' })}
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
            <label>Official License Fee (₹) *</label>
            <input
              type="number"
              {...registerConfig('officialFee', { required: true, valueAsNumber: true, min: 0 })}
              placeholder="Official government fee"
            />
            {errorsConfig.officialFee && <span className="error-text">Required (Min 0)</span>}
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0' }}>
            <input
              type="checkbox"
              id="hasFireFee"
              {...registerConfig('hasFireFee')}
              style={{ width: 'auto', margin: 0 }}
            />
            <label htmlFor="hasFireFee" style={{ margin: 0, fontWeight: 500, cursor: 'pointer' }}>
              Fire Fee Applicable
            </label>
          </div>

          {hasFireFeeWatch && (
            <>
              <div className="form-group">
                <label>Fire Fee (₹) *</label>
                <input
                  type="number"
                  {...registerConfig('fireFee', { required: hasFireFeeWatch, valueAsNumber: true, min: 0 })}
                  placeholder="New application fire fee"
                />
                {errorsConfig.fireFee && <span className="error-text">Required (Min 0)</span>}
              </div>

              <div className="form-group">
                <label>Renewal Fire Fee (₹) *</label>
                <input
                  type="number"
                  {...registerConfig('renewalFireFee', { required: hasFireFeeWatch, valueAsNumber: true, min: 0 })}
                  placeholder="Renewal application fire fee"
                />
                {errorsConfig.renewalFireFee && <span className="error-text">Required (Min 0)</span>}
              </div>
            </>
          )}

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
      </div>
    </div>
  );
}
