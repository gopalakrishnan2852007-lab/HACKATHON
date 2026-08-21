import React from 'react';
import { SimulatorControlPanel } from '../components/simulator/SimulatorControlPanel';

interface SimulatorPageProps {
  selectedMachineId?: string;
  onNavigateToMachine: (id: string) => void;
  onNavigateToAlerts: () => void;
}

export const SimulatorPage: React.FC<SimulatorPageProps> = ({
  selectedMachineId,
  onNavigateToMachine,
  onNavigateToAlerts,
}) => {
  return (
    <div className="space-y-6">
      <SimulatorControlPanel
        selectedMachineId={selectedMachineId}
        onNavigateToMachine={onNavigateToMachine}
        onNavigateToAlerts={onNavigateToAlerts}
      />
    </div>
  );
};
