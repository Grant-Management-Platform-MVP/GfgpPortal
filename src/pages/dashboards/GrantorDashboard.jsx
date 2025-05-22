import React from 'react';
import DashboardLayout from '@components/DashboardLayout';
import AssessmentInvitations from '@components/AssessmentInvitations';
import { Routes, Route, Link } from 'react-router-dom';
import GrantorOverview from '@components/GrantorOverview';
import GranteeComparison from '../../components/GranteeComparison';
import AuditLogs from '../../components/AuditLogs';

const GrantorDashboard = () => {
  return (
    <DashboardLayout title="Grantor Dashboard"  userRole="grantor">
       <Routes>
          <Route index element={<GrantorOverview />} />
          <Route path="grantor-overview" element={<GrantorOverview />} />
          <Route path="invites" element={<AssessmentInvitations />} />
          <Route path="view-assessments" element={<GranteeComparison/>} />
          <Route path="audit-logs" element={<AuditLogs/>} />
        </Routes>
    </DashboardLayout>
  );
};

export default GrantorDashboard;