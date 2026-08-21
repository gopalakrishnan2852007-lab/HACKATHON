/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/layout/Header';
import { Navigation, NavTab } from './components/layout/Navigation';
import { DashboardPage } from './pages/DashboardPage';
import { MachineDetailsPage } from './pages/MachineDetailsPage';
import { AlertsPage } from './pages/AlertsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { SimulatorPage } from './pages/SimulatorPage';
import { useFactoryData } from './hooks/useFactoryData';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedMachineId, setSelectedMachineId] = useState<string>('MCH-101');
  const { machines } = useFactoryData();

  // Hash-based routing synchronization
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('machine/')) {
        const id = hash.split('/')[1];
        if (id) {
          setSelectedMachineId(id);
          setActiveTab('machine-details');
        }
      } else if (hash === 'alerts') {
        setActiveTab('alerts');
      } else if (hash === 'analytics') {
        setActiveTab('analytics');
      } else if (hash === 'maintenance') {
        setActiveTab('maintenance');
      } else if (hash === 'simulator') {
        setActiveTab('simulator');
      } else if (hash === 'dashboard' || hash === '') {
        setActiveTab('dashboard');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateToTab = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === 'dashboard') window.location.hash = 'dashboard';
    else if (tab === 'machine-details') window.location.hash = `machine/${selectedMachineId}`;
    else window.location.hash = tab;
  };

  const handleSelectMachine = (machineId: string) => {
    setSelectedMachineId(machineId);
    setActiveTab('machine-details');
    window.location.hash = `machine/${machineId}`;
  };

  const handleSimulateMachine = (machineId: string) => {
    setSelectedMachineId(machineId);
    setActiveTab('simulator');
    window.location.hash = 'simulator';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 bg-industrial-grid flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Background Radial Glow */}
      <div className="fixed inset-0 pointer-events-none bg-radial-glow opacity-60 z-0" />

      {/* Top Industrial Header */}
      <Header
        onNavigateToAlerts={() => navigateToTab('alerts')}
        onNavigateToSimulator={() => navigateToTab('simulator')}
      />

      {/* Navigation Sub-Header */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={navigateToTab}
        selectedMachineId={selectedMachineId}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <DashboardPage
                onSelectMachine={handleSelectMachine}
                onSimulateMachine={handleSimulateMachine}
                onViewAllAlerts={() => navigateToTab('alerts')}
              />
            </motion.div>
          )}

          {activeTab === 'machine-details' && (
            <motion.div
              key={`machine-${selectedMachineId}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <MachineDetailsPage
                machineId={selectedMachineId}
                onBack={() => navigateToTab('dashboard')}
                onSimulate={handleSimulateMachine}
                onNavigateToMaintenance={() => navigateToTab('maintenance')}
                onSelectMachine={handleSelectMachine}
              />
            </motion.div>
          )}

          {activeTab === 'alerts' && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <AlertsPage onSelectMachine={handleSelectMachine} />
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <AnalyticsPage onSelectMachine={handleSelectMachine} />
            </motion.div>
          )}

          {activeTab === 'maintenance' && (
            <motion.div
              key="maintenance"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <MaintenancePage onSelectMachine={handleSelectMachine} />
            </motion.div>
          )}

          {activeTab === 'simulator' && (
            <motion.div
              key="simulator"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <SimulatorPage
                selectedMachineId={selectedMachineId}
                onNavigateToMachine={handleSelectMachine}
                onNavigateToAlerts={() => navigateToTab('alerts')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Industrial Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-sm py-4 z-10 text-xs text-slate-400 font-mono-data">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-semibold">AIoT Factory Network: ACTIVE</span>
            <span>•</span>
            <span>6/6 Industrial Cells Ingesting</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>Supabase Realtime Stream Ready</span>
            <span>•</span>
            <span>Edge Neural Physics v4.1</span>
            <span>•</span>
            <span>ISO 10816-3 Vibration Standards</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
