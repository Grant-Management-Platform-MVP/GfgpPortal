import React, { useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { getGfgpStructure } from '@utils/gfgpUtils';
import DynamicQuestionnaireForm from '@components/DynamicQuestionnaireForm';

const StartQuestionnaire = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const structure = getGfgpStructure();
  const queryParams = new URLSearchParams(location.search);
  const mode = queryParams.get('mode');
  const tieredLevel = queryParams.get('tieredLevel');

  useEffect(() => {
    if (!structure) {
      console.log("No structure found, redirecting...");
      navigate('/grantee/select-structure');
    }
  }, [structure, navigate, mode]);

  if (!structure) {
    return null;
  }

  return (
    <div className="container mt-4">
      <DynamicQuestionnaireForm selectedStructure={structure} mode={mode} questionnaireId={id} tieredLevel={tieredLevel} />
    </div>
  );
};

export default StartQuestionnaire;