import React from 'react';
import DashboardLayout from '@components/DashboardLayout';
import AssessmentInvitations from '@components/AssessmentInvitations';
import { Routes, Route, Link } from 'react-router-dom';
import GranteeAssessmentList from '@components/GranteeAssessmentList';
import GrantorOverview from '@components/GrantorOverview';
// import GranteeList from '@/pages/funder/GranteeList';
// import AssessmentView from '@/pages/funder/AssessmentView';
// import CompareAssessments from '@/pages/funder/CompareAssessments';



const GrantorDashboard = () => {
  return (
    <DashboardLayout title="Grantor Dashboard"  userRole="grantor">
       <Routes>
          <Route path="grantor-overview" element={<GrantorOverview />} />
          <Route path="invites" element={<AssessmentInvitations />} />
          <Route path="view-assessments" element={<GranteeAssessmentList/>} />

          {/* <Route path="/grantor/grantee-list" element={<GranteeList />} />
          <Route path="/grantor/grantee/:id/view" element={<AssessmentView />} />
          <Route path="/grantor/compare" element={<CompareAssessments />} /> */}
        </Routes>
    </DashboardLayout>
  );
};

export default GrantorDashboard;