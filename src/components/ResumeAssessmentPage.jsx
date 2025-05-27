import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Spinner, Alert } from "react-bootstrap";
import DynamicQuestionnaireForm from "../components/DynamicQuestionnaireForm"; // Adjust path as needed

const ResumeAssessmentPage = () => {
  const { assessmentId } = useParams();
  const [assessmentData, setAssessmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const response = await axios.get(`${BASE_URL}gfgp/assessment/${assessmentId}`);
        setAssessmentData(response.data);
      } catch (err) {
        setError("Failed to load assessment.", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [assessmentId]);

  if (loading) return <Spinner animation="border" className="mt-5" />;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!assessmentData) return null;

  return (
    <div className="container py-4">
      <h3 className="mb-4">Resume Assessment</h3>
      <DynamicQuestionnaireForm
        initialValues={assessmentData.responses || {}} // 🧠 Use saved responses
        structure={assessmentData.structure}
        assessmentId={assessmentId}
        isResume={true}
      />
    </div>
  );
};

export default ResumeAssessmentPage;