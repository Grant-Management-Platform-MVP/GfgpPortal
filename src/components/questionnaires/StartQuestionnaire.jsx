import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGfgpStructure } from '@utils/gfgpUtils';
import DynamicQuestionnaireForm from '@components/DynamicQuestionnaireForm';

const StartQuestionnaire = () => {
  const navigate = useNavigate();
  const structure = getGfgpStructure();

  useEffect(() => {
    if (!structure) {
      navigate('/grantee/select-structure');
    }
  }, [structure, navigate]);

  if (!structure) return null;

  return (
    <div className="container mt-4">
      <DynamicQuestionnaireForm selectedStructure={structure} />
    </div>
  );
};

export default StartQuestionnaire;
