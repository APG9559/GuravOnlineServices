import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { waterSuppliesApi } from '@/api';
import { WaterSupply } from '@/types';
import { useToast } from '@/context/ToastContext';
import { useCustomerLookup } from '@/hooks/useCustomerLookup';

export interface FormValues {
  serviceType: 'NewConnection' | 'ConnectionTransfer' | 'MeterDisconnection' | 'MeterReconnection' | 'NoDuesCertificate' | 'MeterInspection' | 'ChangeOfUse';
  customerName: string;
  phone: string;
  connectionAddress: string;
  applicationTokenNo: string;
  applicationDate: string;
  dateOfService: string;
  officialFee: number;
  serviceFee: number;
  amountCharged: number;

  plumberName?: string;
  plumberPhone?: string;
  contactPersonName?: string;
  contactPersonPhone?: string;
  connectionNo?: string;
  currentOwner?: string;
  newOwnerName?: string;
  newOwnerPhone?: string;
  transferSubtype?: string;
  currentUsage?: string;
  newUsage?: string;
  isContactSameAsPlumber?: boolean;
}

interface UseWaterSupplyFormProps {
  pricing: Record<string, number>;
  today: string;
}

export function useWaterSupplyForm({ pricing, today }: UseWaterSupplyFormProps) {
  const toast = useToast();
  const qc = useQueryClient();
  const [savedRecord, setSavedRecord] = useState<WaterSupply | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const methods = useForm<FormValues>({
    defaultValues: {
      serviceType: 'NewConnection',
      applicationDate: today,
      dateOfService: today,
      officialFee: 1000,
      serviceFee: 500,
      amountCharged: 1500,
      plumberName: '',
      plumberPhone: '',
      contactPersonName: '',
      contactPersonPhone: '',
      isContactSameAsPlumber: false,
      connectionNo: '',
      currentOwner: '',
      newOwnerName: '',
      newOwnerPhone: '',
      transferSubtype: 'Purchase',
      currentUsage: '',
      newUsage: '',
    },
  });

  const { setValue, watch, reset } = methods;

  const serviceTypeWatch = watch('serviceType');
  const phoneWatch = watch('phone');
  const officialFeeWatch = watch('officialFee') ?? 0;
  const serviceFeeWatch = watch('serviceFee') ?? 0;

  const { showAutoFillIndicator, resetIndicator } = useCustomerLookup(
    phoneWatch,
    (customer) => {
      setValue('customerName', customer.name);
      if (customer.address) {
        setValue('connectionAddress', customer.address);
      }
      if (serviceTypeWatch === 'ConnectionTransfer') {
        setValue('currentOwner', customer.name);
      }
    }
  );

  // Sync currentOwner if serviceType changes after customer name has been loaded
  useEffect(() => {
    if (serviceTypeWatch === 'ConnectionTransfer' && phoneWatch) {
      const currentName = methods.getValues('customerName');
      if (currentName) {
        setValue('currentOwner', currentName);
      }
    }
  }, [serviceTypeWatch, phoneWatch, methods, setValue]);

  const getPricingKeys = (type: string) => {
    switch (type) {
      case 'NewConnection': return { official: 'water_supply_new_official_fee', service: 'water_supply_new_service_fee' };
      case 'ConnectionTransfer': return { official: 'water_supply_transfer_official_fee', service: 'water_supply_transfer_service_fee' };
      case 'MeterDisconnection': return { official: 'water_supply_disconnection_official_fee', service: 'water_supply_disconnection_service_fee' };
      case 'MeterReconnection': return { official: 'water_supply_reconnection_official_fee', service: 'water_supply_reconnection_service_fee' };
      case 'NoDuesCertificate': return { official: 'water_supply_nodues_official_fee', service: 'water_supply_nodues_service_fee' };
      case 'MeterInspection': return { official: 'water_supply_inspection_official_fee', service: 'water_supply_inspection_service_fee' };
      case 'ChangeOfUse': return { official: 'water_supply_change_official_fee', service: 'water_supply_change_service_fee' };
      default: return { official: 'water_supply_new_official_fee', service: 'water_supply_new_service_fee' };
    }
  };

  const getFallbackFees = (type: string) => {
    switch (type) {
      case 'NewConnection': return { official: 1000, service: 500 };
      case 'ConnectionTransfer': return { official: 500, service: 300 };
      case 'MeterDisconnection': return { official: 200, service: 150 };
      case 'MeterReconnection': return { official: 300, service: 200 };
      case 'NoDuesCertificate': return { official: 150, service: 100 };
      case 'MeterInspection': return { official: 200, service: 150 };
      case 'ChangeOfUse': return { official: 400, service: 250 };
      default: return { official: 1000, service: 500 };
    }
  };

  const keys = getPricingKeys(serviceTypeWatch);
  const fallbacks = getFallbackFees(serviceTypeWatch);

  const defaultOfficial = pricing[keys.official] ?? fallbacks.official;
  const defaultService = pricing[keys.service] ?? fallbacks.service;

  // Set official and service fees when service type changes
  useEffect(() => {
    setValue('officialFee', defaultOfficial);
    setValue('serviceFee', defaultService);
  }, [serviceTypeWatch, defaultOfficial, defaultService, setValue]);

  // Recalculate amountCharged as officialFee + serviceFee
  useEffect(() => {
    setValue('amountCharged', Number(officialFeeWatch) + Number(serviceFeeWatch));
  }, [officialFeeWatch, serviceFeeWatch, setValue]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const { isContactSameAsPlumber, ...payload } = data;
      return waterSuppliesApi.create(payload).then((r) => r.data);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['water-supplies'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setSavedRecord(data);
      setShowSuccessModal(true);
      toast.success('Water supply service record created successfully.');
      resetIndicator();
      reset({
        serviceType: 'NewConnection',
        customerName: '',
        phone: '',
        connectionAddress: '',
        applicationTokenNo: '',
        applicationDate: today,
        dateOfService: today,
        officialFee: pricing.water_supply_new_official_fee ?? 1000,
        serviceFee: pricing.water_supply_new_service_fee ?? 500,
        amountCharged: (pricing.water_supply_new_official_fee ?? 1000) + (pricing.water_supply_new_service_fee ?? 500),
        plumberName: '',
        plumberPhone: '',
        contactPersonName: '',
        contactPersonPhone: '',
        connectionNo: '',
        currentOwner: '',
        newOwnerName: '',
        newOwnerPhone: '',
        transferSubtype: 'Purchase',
        currentUsage: '',
        newUsage: '',
        isContactSameAsPlumber: false,
      });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to create water supply service record.');
    }
  });

  return {
    methods,
    serviceTypeWatch,
    showAutoFillIndicator,
    defaultOfficial,
    defaultService,
    savedRecord,
    setSavedRecord,
    showSuccessModal,
    setShowSuccessModal,
    mutation,
  };
}
