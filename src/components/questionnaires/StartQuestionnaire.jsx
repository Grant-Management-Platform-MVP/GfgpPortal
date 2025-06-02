import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getGfgpStructure } from '@utils/gfgpUtils';
import DynamicQuestionnaireForm from '@components/DynamicQuestionnaireForm';

const StartQuestionnaire = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const structure = getGfgpStructure();

  useEffect(() => {
    if (!structure) {
      navigate('/grantee/select-structure');
    }
  }, [structure, navigate]);

  if (!structure) return null;

  const queryParams = new URLSearchParams(location.search);
  const mode = queryParams.get('mode');

  return (
    <div className="container mt-4">
      <DynamicQuestionnaireForm selectedStructure={structure} mode={mode} />
    </div>
  );
};

export default StartQuestionnaire;
