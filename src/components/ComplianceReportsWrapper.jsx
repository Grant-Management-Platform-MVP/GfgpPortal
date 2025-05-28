import React from 'react';
import { useParams } from 'react-router-dom';
import ComplianceReports from '@components/ComplianceReports';

const ComplianceReportsWrapper = () => {
  const { granteeId, structure } = useParams();
  return <ComplianceReports granteeId={parseInt(granteeId)} structure={structure} />;
};

export default ComplianceReportsWrapper;
