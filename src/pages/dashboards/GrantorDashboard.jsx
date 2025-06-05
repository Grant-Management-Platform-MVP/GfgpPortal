import React from 'react';
import DashboardLayout from '@components/DashboardLayout';
import AssessmentInvitations from '@components/AssessmentInvitations';
import { Routes, Route, Link } from 'react-router-dom';
import GrantorOverview from '@components/GrantorOverview';
import GranteeComparison from '../../components/GranteeComparison';
import AuditLogs from '../../components/AuditLogs';
import ComplianceReportsWrapper from '../../components/ComplianceReportsWrapper';
import SharedReportsList from '../../components/SharedReportsList';
import ReportsDashboard from '@pages/admin/ReportsDashboard';

const GrantorDashboard = () => {
  return (
    <DashboardLayout title="Grantor Dashboard"  userRole="grantor">
       <Routes>
          <Route index element={<GrantorOverview />} />
          <Route path="grantor-overview" element={<GrantorOverview />} />
          <Route path="invites" element={<AssessmentInvitations />} />
          <Route path="view-assessments" element={<GranteeComparison/>} />
          <Route path="view-report/:granteeId/:structure/:id" element={<ComplianceReportsWrapper />} />
          <Route path="shared-reports" element={<SharedReportsList />} />
          <Route path="audit-logs" element={<AuditLogs/>} />
           <Route path="grantee-reports" element={<ReportsDashboard/>} />
        </Routes>
    </DashboardLayout>
  );
};

export default GrantorDashboard;