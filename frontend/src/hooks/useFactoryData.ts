import { useState, useEffect, useCallback } from 'react';
import { dataService } from '../services/dataService';
import { apiService } from '../services/api';
import { getSupabaseStatus } from '../lib/supabase';
import { Machine, Alert, Maintenance, Prediction, FactoryHealthMetrics } from '../types';

export function useFactoryData() {
  const [machines, setMachines] = useState<Machine[]>(dataService.getMachines());
  const [alerts, setAlerts] = useState<Alert[]>(dataService.getAlerts());
  const [maintenance, setMaintenance] = useState<Maintenance[]>(dataService.getMaintenance());
  const [metrics, setMetrics] = useState<FactoryHealthMetrics>(dataService.getFactoryMetrics());
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(dataService.getIsLiveStreaming());
  const [supabaseStatus] = useState(getSupabaseStatus());
  const [backendStatus, setBackendStatus] = useState(apiService.getBackendStatus());

  const updateAllState = useCallback(() => {
    setMachines([...dataService.getMachines()]);
    setAlerts([...dataService.getAlerts()]);
    setMaintenance([...dataService.getMaintenance()]);
    setMetrics(dataService.getFactoryMetrics());
    setIsLiveStreaming(dataService.getIsLiveStreaming());
    setBackendStatus(apiService.getBackendStatus());
  }, []);

  useEffect(() => {
    const unsubscribe = dataService.subscribe(updateAllState);

    const checkHealth = () => {
      apiService.checkBackendHealth().then(() => {
        setBackendStatus(apiService.getBackendStatus());
      });
    };

    checkHealth();
    const interval = setInterval(checkHealth, 3000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [updateAllState]);

  return {
    machines,
    alerts,
    maintenance,
    metrics,
    isLiveStreaming,
    supabaseStatus,
    backendStatus,
    syncFromBackend: () => dataService.syncFromBackend(),
    toggleLiveStream: (val?: boolean) => dataService.toggleLiveStream(val),
    getMachine: (id: string) => dataService.getMachine(id),
    getPrediction: (id: string) => dataService.getPrediction(id),
    acknowledgeAlert: (id: string) => dataService.acknowledgeAlert(id),
    resolveAlert: (id: string) => dataService.resolveAlert(id),
    updateMaintenanceStatus: (id: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED', notes?: string) =>
      dataService.updateMaintenanceStatus(id, status, notes),
    createMaintenanceTask: (task: Omit<Maintenance, 'id' | 'created_at'>) =>
      dataService.createMaintenanceTask(task),
    injectSimulatedTelemetry: (
      machineId: string,
      telemetry: { temperature: number; vibration: number; current: number; rpm: number; scenarioName?: string }
    ) => dataService.injectSimulatedTelemetry(machineId, telemetry),
    resetMachine: (id: string) => dataService.resetMachine(id),
  };
}
