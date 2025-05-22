import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import DashboardLayout from '@components/DashboardLayout';
import ComplianceReports from '@components/ComplianceReports';
import StartQuestionnaire from '@components/questionnaires/StartQuestionnaire';
import Profile from '@common/ProfilePage';
import SelectStructure from '@components/grantee/SelectStructure';
import ConsentRequestsCard from '@components/ConsentRequestsCard';

const GranteeDashboard = () => {
  return (
    <DashboardLayout title="Grantee Dashboard" userRole="grantee">
      <div className="container mt-4">
        {/* Routes for other dashboard features */}
        <Routes>
          <Route index element={<ConsentRequestsCard />} />
          <Route path="select-structure" element={<SelectStructure />} />
          <Route path="questionnaire" element={<StartQuestionnaire />} />
          <Route path="compliance-reports" element={<ComplianceReports />} />
          <Route path="profile" element={<Profile />} />
        </Routes>
      </div>
    </DashboardLayout>
  );
};

export default GranteeDashboard;