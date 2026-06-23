import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tradeLicensesApi } from '@/api';
import NeoSelect from '@/components/NeoSelect';
import { useAuth } from '@/context/AuthContext';

export default function ConfigsTab() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();

  // Queries
  const { data: configs = [], isLoading: configsLoading } = useQuery({
    queryKey: ['trade-configs'],
    queryFn: () => tradeLicensesApi.getConfigs().then((r) => r.data),
  });

  // Unique trade types for select dropdown
  const uniqueTradeTypes = Array.from(new Set(configs.map((c) => c.tradeType)));

  // Mutations
  const configMutation = useMutation({
    mutationFn: (data: { tradeType: string; tradeSubtype: string; officialFee: number }) =>
      tradeLicensesApi.createConfig(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trade-configs'] });
    },
  });

  const deleteConfigMutation = useMutation({
    mutationFn: (id: string) => tradeLicensesApi.deleteConfig(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trade-configs'] });
    },
  });

  // Form
  const {
    register: registerConfig,
    handleSubmit: handleSubmitConfig,
    control: controlConfig,
    watch: watchConfig,
    reset: resetConfig,
    formState: { errors: errorsConfig },
  } = useForm<{ tradeTypeSelect: string; newTradeType?: string; tradeSubtype: string; officialFee: number }>({
    defaultValues: {
      tradeTypeSelect: '',
      newTradeType: '',
      tradeSubtype: '',
      officialFee: 0,
    },
  });

  const configTradeTypeSelectWatch = watchConfig('tradeTypeSelect');

  const onConfigSubmit = (data: { tradeTypeSelect: string; newTradeType?: string; tradeSubtype: string; officialFee: number }) => {
    const tradeType = (data.tradeTypeSelect === '__NEW__' || uniqueTradeTypes.length === 0)
      ? data.newTradeType?.trim()
      : data.tradeTypeSelect;

    if (!tradeType) {
      alert('Please specify a trade category');
      return;
    }

    configMutation.mutate(
      { tradeType, tradeSubtype: data.tradeSubtype, officialFee: Number(data.officialFee) },
      {
        onSuccess: () => {
          resetConfig({
            tradeTypeSelect: '',
            newTradeType: '',
            tradeSubtype: '',
            officialFee: 0,
          });
        },
      }
    );
  };

  return (
    <div className="grid-2">
      {/* List panel */}
      <div className="card" style={{ padding: 0 }}>
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {configs.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.tradeType}</td>
                    <td>{c.tradeSubtype}</td>
                    <td>₹{c.officialFee}</td>
                    <td>
                      {isAdmin && (
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
        <div style={{ fontWeight: 500, fontSize: 15, marginBottom: '1rem' }}>Add Trade Type Fee Configuration</div>

        {configMutation.isSuccess && (
          <div className="alert-success" style={{ marginBottom: 12 }}>Config rate added successfully!</div>
        )}
        {configMutation.isError && (
          <div className="alert-error" style={{ marginBottom: 12 }}>Failed to add config. Already exists?</div>
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
                      ...uniqueTradeTypes.map((t) => ({ value: t, label: t })),
                      { value: '__NEW__', label: '+ Create New Category...' },
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

          <button className="btn btn-primary" type="submit" disabled={configMutation.isPending}>
            {configMutation.isPending ? 'Saving...' : 'Add Configuration Rate'}
          </button>
        </form>
      </div>
    </div>
  );
}
