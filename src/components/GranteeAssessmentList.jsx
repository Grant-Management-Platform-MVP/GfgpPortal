import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const GranteeAssessmentDetail = () => {
  const { id } = useParams();
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    axios
      .get(`${BASE_URL}gfgp/grantor/grantee-assessments`)
      .then((res) => {
        const data = res.data;
        setAssessments(data);
        const found = data.find((a) => a.id === parseInt(id)) || data[0];
        setSelectedAssessment(found);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching assessments', err);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!selectedAssessment) return;
    const { structure } = selectedAssessment;
    axios
      .get(`${BASE_URL}gfgp/questionnaire-templates/structure/${structure}`)
      .then((res) => {
        const foundTemplate = Array.isArray(res.data) ? res.data[0] : res.data;
        setTemplate(foundTemplate);
      })
      .catch((err) => {
        console.error('Error fetching template data', err);
      });
  }, [selectedAssessment]);

  let parsedAnswers = {};
  try {
    parsedAnswers = JSON.parse(selectedAssessment?.answers || '{}');
  } catch (e) {
    console.warn('Error parsing answers:', e);
  }

  let parsedTemplate = null;
  try {
    if (template?.content && typeof template.content === 'string') {
      parsedTemplate = JSON.parse(template.content);
    } else if (template?.sections) {
      parsedTemplate = template;
    }
  } catch (e) {
    console.error('Failed to parse template content', e);
  }

  if (loading) {
    return (
      <div className="placeholder-glow p-4">
        <div className="placeholder col-12 mb-2" style={{ height: '100px' }}></div>
      </div>
    );
  }

  if (!selectedAssessment) return <p>No assessment data found.</p>;

  const { granteeName, structure, submittedAt, status, score } = selectedAssessment;

  return (
    <div className="container py-4">
      {/* Card 1: Overview */}
      <div className="card mb-4">
        <div className="card-body">
          <h2 className="card-title h4 mb-3">Assessment Overview</h2>

          <div className="mb-3">
            <label className="form-label">Switch Assessment</label>
            <select
              className="form-select w-100 w-md-50"
              onChange={(e) =>
                setSelectedAssessment(assessments.find((a) => a.id.toString() === e.target.value))
              }
              value={selectedAssessment?.id}
            >
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.granteeName || `Grantee #${a.userId}`}
                </option>
              ))}
            </select>
          </div>

          <div className="row">
            <div className="col-md-4 mb-3">
              <strong>Grantee:</strong> {granteeName || `Grantee #${selectedAssessment.userId}`}
            </div>
            <div className="col-md-4 mb-3">
              <strong>Structure:</strong> {structure}
            </div>
            <div className="col-md-4 mb-3">
              <strong>Status:</strong> {status}
            </div>
            <div className="col-md-4 mb-3">
              <strong>Score:</strong> {score ?? 'N/A'}
            </div>
            <div className="col-md-4 mb-3">
              <strong>Submitted:</strong>{' '}
              {new Date(submittedAt ?? selectedAssessment.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Template + Answers */}
      <div className="card">
        <div className="card-body">
          <h3 className="card-title h5 mb-4">Assessment Responses</h3>
          {parsedTemplate?.sections?.length > 0 ? (
            <div className="accordion" id="accordionSections">
              {parsedTemplate.sections.map((section, sIdx) => (
                <div className="accordion-item" key={sIdx}>
                  <h2 className="accordion-header" id={`heading-${sIdx}`}>
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#collapse-${sIdx}`}
                      aria-expanded="false"
                      aria-controls={`collapse-${sIdx}`}
                    >
                      {section.title || `Section ${sIdx + 1}`}
                    </button>
                  </h2>
                  <div
                    id={`collapse-${sIdx}`}
                    className="accordion-collapse collapse"
                    aria-labelledby={`heading-${sIdx}`}
                    data-bs-parent="#accordionSections"
                  >
                    <div className="accordion-body">
                      {section.questions?.map((q, qIdx) => {
                        const answer = parsedAnswers[q.id];
                        return (
                          <div key={qIdx} className="mb-3">
                            <p className="fw-bold">Q: {q.questionText || q.id}</p>
                            <p className="text-primary">👉 {answer ?? 'N/A'}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No structured template found or responses are unavailable.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GranteeAssessmentDetail;