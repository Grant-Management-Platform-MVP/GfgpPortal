import React from 'react';
import { useParams } from 'react-router-dom';
import ComplianceReports from '@components/ComplianceReports';

const ComplianceReportsWrapper = () => {
  const { userId, structure } = useParams();
  return <ComplianceReports userId={parseInt(userId)} structure={structure} />;
};

export default ComplianceReportsWrapper;
