import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import DashboardLayout from '@components/DashboardLayout';
import ComplianceReports from '@components/ComplianceReports';
import StartQuestionnaire from '@components/StartQuestionnaire';


const GranteeDashboard = () => (
  <DashboardLayout title="Grantee Dashboard" userRole="grantee">
    <Routes>
      <Route path="questionnaire" element={<StartQuestionnaire />} />
      <Route path="compliance-reports" element={<ComplianceReports />} />
    </Routes>
  </DashboardLayout>
);
export default GranteeDashboard;
