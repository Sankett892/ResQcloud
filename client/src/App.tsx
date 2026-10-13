import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout.js';
import { RescueLayout } from './layouts/RescueLayout.js';

// Pages
import { LandingPage } from './pages/LandingPage.js';
import { CitizenPortal } from './pages/CitizenPortal.js';
import { RescueDashboard } from './pages/RescueDashboard.js';
import { LiveIncidentsPage } from './pages/LiveIncidentsPage.js';
import { DisasterMapPage } from './pages/DisasterMapPage.js';
import { IncidentHistoryPage } from './pages/IncidentHistoryPage.js';
import { AnalyticsPage } from './pages/AnalyticsPage.js';
import { RelaySimulatorPage } from './pages/RelaySimulatorPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        {/* Public Routes */}
        <Route index element={<LandingPage />} />
        <Route path="citizen" element={<CitizenPortal />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        {/* Rescue Team Command Desk Protected Hierarchy */}
        <Route path="rescue" element={<RescueLayout />}>
          <Route index element={<Navigate to="/rescue/dashboard" replace />} />
          <Route path="dashboard" element={<RescueDashboard />} />
          <Route path="incidents" element={<LiveIncidentsPage />} />
          <Route path="map" element={<DisasterMapPage />} />
          <Route path="history" element={<IncidentHistoryPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="relay-simulator" element={<RelaySimulatorPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default App;
