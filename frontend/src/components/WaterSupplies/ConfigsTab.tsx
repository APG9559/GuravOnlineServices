import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { waterSuppliesApi } from '@/api';
import NeoSelect from '@/components/NeoSelect';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/Modal';
import { WaterFeeConfig } from '@/types';
import { WATER_SERVICE_TYPE_LABELS } from '../WaterSupplies/WaterSupplyPaymentsModal';

interface ConfigFormValues {
  serviceType: string;
  officialFee: number;
  serviceFee: number;
  protocolFee: number;
  defaultMiscFee: number;
  allowManualOverride: boolean;
  effectiveDate?: string;
}

export default function ConfigsTab() {
  const qc = useQueryClient();
  const { user, isAdmin } = useAuth();
  const hasConfigAccess = isAdmin || user?.role === 'operator';
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Queries
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['water-configs'],
    queryFn: () => waterSuppliesApi.getConfigs().then((r) => r.data),
  });

  const filteredConfigs = configs.filter((c) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const label = WATER_SERVICE_TYPE_LABELS[c.serviceType] || c.serviceType;
    return (
      c.serviceType.toLowerCase().includes(query) ||
      label.toLowerCase().includes(query)
    );
  });

  const { register, handleSubmit, reset, setValue, watch, control } = useForm<ConfigFormValues>({
    defaultValues: {
      serviceType: '',
      officialFee: 0,
      serviceFee: 0,
      protocolFee: 0,
      defaultMiscFee: 0,
      allowManualOverride: true,
      effectiveDate: new Date().toISOString().split('T')[0],
    },
  });

  const isOverride = watch('allowManualOverride');

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: ConfigFormValues) => waterSuppliesApi.createConfig(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['water-configs'] });
      closeForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ConfigFormValues & { id: string }) =>
      waterSuppliesApi.updateConfig(data.id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['water-configs'] });
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => waterSuppliesApi.deleteConfig(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['water-configs'] });
    },
  });

  const onSubmit = (data: ConfigFormValues) => {
    if (editingConfigId) {
      updateMutation.mutate({ ...data, id: editingConfigId });
    } else {
      createMutation.mutate(data);
    }
  };

  const startEdit = (config: WaterFeeConfig) => {
    setEditingConfigId(config.id);
    setValue('serviceType', config.serviceType);
    setValue('officialFee', Number(config.officialFee));
    setValue('serviceFee', Number(config.serviceFee));
    setValue('protocolFee', Number(config.protocolFee || 0));
    setValue('defaultMiscFee', Number(config.defaultMiscFee || 0));
    setValue('allowManualOverride', config.allowManualOverride);
    if (config.effectiveDate) {
      setValue('effectiveDate', config.effectiveDate.split('T')[0]);
    }
    setIsFormOpen(true);
  };

  const startAdd = () => {
    setEditingConfigId(null);
    reset({
      serviceType: '',
      officialFee: 0,
      serviceFee: 0,
      protocolFee: 0,
      defaultMiscFee: 0,
      allowManualOverride: true,
      effectiveDate: new Date().toISOString().split('T')[0],
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingConfigId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this configuration?')) {
      deleteMutation.mutate(id);
    }
  };

  const serviceTypeOptions = Object.entries(WATER_SERVICE_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading configurations...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header controls */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by service type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          style={{ maxWidth: 300 }}
        />
        {hasConfigAccess && (
          <button className="btn btn-primary" onClick={startAdd}>
            + Add Configuration
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="table-responsive" style={{ border: '3.5px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: '4px 4px 0 var(--border)', overflow: 'hidden' }}>
        <table className="table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>Service Type</th>
              <th style={{ textAlign: 'right' }}>Official Fee</th>
              <th style={{ textAlign: 'right' }}>Service Fee</th>
              <th style={{ textAlign: 'right' }}>Protocol Fee</th>
              <th style={{ textAlign: 'right' }}>Default Misc Fee</th>
              <th style={{ textAlign: 'center' }}>Manual Override</th>
              {hasConfigAccess && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredConfigs.length === 0 ? (
              <tr>
                <td colSpan={hasConfigAccess ? 7 : 6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No pricing configurations found.
                </td>
              </tr>
            ) : (
              filteredConfigs.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700 }}>
                    {WATER_SERVICE_TYPE_LABELS[c.serviceType] || c.serviceType}
                    <span style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>
                      Code: {c.serviceType}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{Number(c.officialFee).toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{Number(c.serviceFee).toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{Number(c.protocolFee || 0).toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{Number(c.defaultMiscFee || 0).toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${c.allowManualOverride ? 'badge-success' : 'badge-danger'}`}>
                      {c.allowManualOverride ? 'Yes' : 'No'}
                    </span>
                  </td>
                  {hasConfigAccess && (
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm" onClick={() => startEdit(c)}>
                          Edit
                        </button>
                        {isAdmin && (
                          <button
                            className="btn btn-sm"
                            style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
                            onClick={() => handleDelete(c.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isFormOpen && (
        <Modal title={editingConfigId ? 'Edit Configuration' : 'Add Configuration'} onClose={closeForm}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>Service Type *</label>
              {editingConfigId ? (
                <input
                  type="text"
                  value={WATER_SERVICE_TYPE_LABELS[watch('serviceType')] || watch('serviceType')}
                  readOnly
                  style={{ background: 'var(--bg)', cursor: 'not-allowed' }}
                />
              ) : (
                <NeoSelect
                  value={watch('serviceType')}
                  onChange={(val) => setValue('serviceType', val)}
                  options={serviceTypeOptions}
                  placeholder="Select Service Type"
                />
              )}
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Official Fee (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('officialFee', { required: true, valueAsNumber: true })}
                />
              </div>
              <div className="form-group">
                <label>Service Fee (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('serviceFee', { required: true, valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Protocol Fee (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('protocolFee', { valueAsNumber: true })}
                />
              </div>
              <div className="form-group">
                <label>Default Misc Fee (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('defaultMiscFee', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="checkbox-row" style={{ margin: '8px 0' }}>
              <input
                type="checkbox"
                id="allowManualOverride"
                {...register('allowManualOverride')}
              />
              <label htmlFor="allowManualOverride" style={{ cursor: 'pointer', fontWeight: 600 }}>
                Allow manual price override on form
              </label>
            </div>

            <div className="form-group">
              <label>Effective Date</label>
              <input
                type="date"
                {...register('effectiveDate')}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createMutation.isPending || updateMutation.isPending}
                style={{ flex: 1 }}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Configuration'}
              </button>
              <button type="button" className="btn" onClick={closeForm} style={{ flex: 1 }}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
