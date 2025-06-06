import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import DashboardLayout from '@components/DashboardLayout';
import ComplianceReports from '@components/ComplianceReports';
import StartQuestionnaire from '@components/questionnaires/StartQuestionnaire';
import Profile from '@common/ProfilePage';
import SelectStructure from '@components/grantee/SelectStructure';
import ConsentRequestsCard from '@components/ConsentRequestsCard';
import DocumentRepository from '@components/DocumentRepository';
import AssessmentListPage from '@pages/AssessmentListPage';
import AssessmentFromInvite from '@components/AssessmentFromInvite';

const GranteeDashboard = () => {
  return (
    <DashboardLayout title="Grantee Dashboard" userRole="grantee">
      <div className="container mt-4">
        {/* Routes for other dashboard features */}
        <Routes>
          <Route index element={<ConsentRequestsCard />} />
          <Route path="select-structure" element={<SelectStructure />} />
          <Route path="assessments" element={<AssessmentListPage />} />
          <Route path="compliance-reports" element={<ComplianceReports />} />
          <Route path="profile" element={<Profile />} />
          <Route path="documents" element={<DocumentRepository/>} />
          <Route path="questionnaire" element={<StartQuestionnaire/>} />
          <Route path="assessment-invite/:inviteId/:tieredLevel" element={<AssessmentFromInvite />} />
          <Route path="*" element={<div>404 - Route Not Found</div>} />
        </Routes>
      </div>
    </DashboardLayout>
  );
};

export default GranteeDashboard;