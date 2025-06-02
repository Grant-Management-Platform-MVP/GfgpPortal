import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Card, Spinner, Alert, Modal } from 'react-bootstrap';
import { BiInfoCircle, BiUser, BiPlayCircle, BiEditAlt, BiSync } from 'react-icons/bi';
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";


const ConsentRequestsCard = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const [requests, setRequests] = useState([]);
  const [previousAssessments, setPreviousAssessments] = useState([]);
  const [structure, setStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPending, setShowPending] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [questionnaireTemplate, setQuestionnaireTemplate] = useState(null);
  const [hydratedTemplate, setHydratedTemplate] = useState(null);
  const parsedTemplate = questionnaireTemplate?.content
  ? JSON.parse(questionnaireTemplate.content)
  : null;
  const [assessmentInvites, setAssessmentInvites] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.userId;
  if (!userId) throw new Error("User ID not found in localStorage.");


  useEffect(() => {
    if (parsedTemplate && selectedAssessment?.answers?.length > 0) {
      // Deep copy to avoid mutating state directly
      const templateWithAnswers = JSON.parse(JSON.stringify(parsedTemplate));

      // Assuming each answer has questionId and value
      selectedAssessment.answers.forEach(answer => {
        templateWithAnswers.sections.forEach(section => {
          section.questions.forEach(question => {
            if (question.id === answer.questionId) {
              question.answer = answer.value; // Bind the user's answer
            }
          });
        });
      });

      setHydratedTemplate(templateWithAnswers);
    }
  }, [parsedTemplate, selectedAssessment]);

  const handleViewAssessment = async (assessment) => {
    setSelectedAssessment(assessment);
    setViewModalVisible(true);

    try {
      const response = await fetch(`${BASE_URL}gfgp/questionnaire-templates/structure/${assessment.structure}`);
      const template = await response.json();
      console.log("Fetched template:", template);
      setQuestionnaireTemplate(template);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load template", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`${BASE_URL}gfgp/grantor/grantee-assessments/${userId}`); //fetching consent requests by grantee
        const pending = data.filter(r => r.consentStatus === "PENDING").map(r => ({ ...r, actionLoading: false }));
        const accepted = data.filter(r => r.consentStatus === "GRANTED");

        const { data: invites } = await axios.get(`${BASE_URL}gfgp/assessment-invites/${userId}`);
        setAssessmentInvites(invites || []);

        setRequests(pending);
        setPreviousAssessments(accepted);

        if (accepted.length > 0) setStructure(accepted[0].structure);
        // Fetch previous assessments

        const { data: assessments } = await axios.get(`${BASE_URL}gfgp/assessment/${userId}`);
        setPreviousAssessments(assessments);

      if (assessments.length > 0) setStructure(assessments[0].structure);

        // Smooth cascading UI load
        setTimeout(() => setShowPending(true), 300);
        setTimeout(() => setShowHistory(true), 700);
      } catch (err) {
        console.log("Error fetching consent requests:", err);
        setError("Failed to fetch consent requests.", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const updateConsent = async (id, status) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, actionLoading: true } : r));
    try {
      await axios.put(`${BASE_URL}gfgp/consent-requests/${id}`, { status });
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      toast.error("Failed to update consent.", err);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, actionLoading: false } : r));
    }
  };

  const handleChangeStructure = () => {
    // You could open a modal, or navigate to structure selection route
    toast.success("Feature to change structure is coming soon 🚧");
  };

  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" />
        <p className="mt-2">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;
  const getDistinctAssessments = (assessments) => {
    const grouped = {};

    // Group by structure
    assessments.forEach((a) => {
      const structure = a.structure;

      if (!grouped[structure]) {
        grouped[structure] = [];
      }

      grouped[structure].push(a);
    });

    const distinct = [];

    Object.values(grouped).forEach((group) => {
      const submitted = group.find((a) => a.status === "SUBMITTED");

      if (submitted) {
        distinct.push(submitted);
      } else {
        // Get the latest draft by comparing `lastUpdated` or fallback to `createdAt`
        const latestDraft = group
          .filter((a) => a.status === "SAVED")
          .sort((a, b) =>
            new Date(b.lastUpdated || b.createdAt) - new Date(a.lastUpdated || a.createdAt)
          )[0];

        if (latestDraft) {
          distinct.push(latestDraft);
        }
      }
    });

    return distinct;
  };

  const filteredAssessments = getDistinctAssessments(previousAssessments);


  return (
    <>
      {/* Section 1: Pending Requests */}
      {showPending && (
        <Card className="mb-4 shadow-sm animate__animated animate__fadeIn">
          <Card.Body>
            <h5 className="mb-4">Pending Requests for your Compliance Report</h5>

            {requests.length === 0 ? (
              <div className="text-center text-muted py-4">
                <BiInfoCircle size={40} className="mb-2" />
                <p>No pending requests from funders at the moment.</p>
              </div>
            ) : (
              requests.map(req => (
                <div
                  key={req.id}
                  className="d-flex justify-content-between align-items-start border rounded p-3 mb-3 flex-column flex-md-row"
                  style={{ transition: 'opacity 0.5s ease-in-out' }}
                >
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center mb-2">
                      <BiUser className="me-2" />
                      <strong>Requested by Grantor:</strong> {req.requestedBy || `Grantor #${req.grantorId}`}
                    </div>
                    <div><strong>GFGP Structure:</strong> {req.structure}</div>
                    <div className="text-muted small">
                      Requested on: {new Date(req.consentUpdatedAt || req.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-3 mt-md-0 ms-md-3 d-flex gap-2">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => updateConsent(req.id, "GRANTED")}
                      disabled={req.actionLoading}
                    >
                      {req.actionLoading ? <Spinner animation="border" size="sm" /> : 'Accept'}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => updateConsent(req.id, "DENIED")}
                      disabled={req.actionLoading}
                    >
                      {req.actionLoading ? <Spinner animation="border" size="sm" /> : 'Deny'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </Card.Body>
        </Card>
      )}

      {/* Section 2: Previous Assessments */}
      {showHistory && (
        <Card className="mb-4 shadow-sm animate__animated animate__fadeIn">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Your Previous Assessments</h5>
              {structure && (
                <Button size="sm" variant="outline-secondary" onClick={handleChangeStructure}>
                  <BiSync className="me-1" /> Change Structure
                </Button>
              )}
            </div>

            {filteredAssessments.length === 0 ? (
              <div className="text-center text-muted py-4">
                <BiInfoCircle size={40} className="mb-2" />
                <p>No previous assessments available.</p>
              </div>
            ) : (
              filteredAssessments.map((assessment, idx) => (
                <div
                  key={assessment.id || idx}
                  className="d-flex justify-content-between align-items-start border rounded p-3 mb-3 flex-column flex-md-row"
                >
                  <div className="flex-grow-1">
                    <div><strong>GFGP Structure:</strong> {assessment.structure}</div>
                    <div><strong>Status:</strong> {assessment.status}</div>
                    <div className="text-muted small">
                      Submitted on: {new Date(assessment.updatedAt || assessment.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-3 mt-md-0 ms-md-3 d-flex gap-2">
                    {assessment.status === "SAVED" && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => navigate(`/resume-assessment/${assessment.id}`)}
                        style={{ display:'none' }}
                      >
                        <BiPlayCircle className="me-1" /> Resume
                      </Button>
                    )}
                    <Button size="sm" variant="outline-info" onClick={() => handleViewAssessment(assessment)} style={{ display:'none' }}>
                      <BiEditAlt className="me-1" /> View
                    </Button>
                  </div>
                </div>
              ))
            )}
          </Card.Body>

            <Card.Body>
              <h5 className="mb-4">Assessment Invitations from Funders</h5>
              {assessmentInvites.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <BiInfoCircle size={40} className="mb-2" />
                  <p>No invitations received at the moment.</p>
                </div>
              ) : (
                assessmentInvites.map((invite) => (
                  <div key={invite.id} className="d-flex justify-content-between align-items-start border rounded p-3 mb-3 flex-column flex-md-row">
                    <div className="flex-grow-1">
                      <div><strong>Invited By (Grantor):</strong> {invite.invitedBy || `Grantor #${invite.grantorId}`}</div>
                      <div><strong>Grantee Name:</strong> {invite.granteeName}</div>
                      <div><strong>Structure:</strong> {invite.structureType}</div>
                      <div className="text-muted small">
                        Date Invited: {new Date(invite.dateInvited).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </Card.Body>
          <Modal show={viewModalVisible} onHide={() => setViewModalVisible(false)} size="xl">
            <Modal.Header closeButton>
              <Modal.Title>Assessment Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {!hydratedTemplate ? (
                <div className="text-center my-4">
                  <Spinner animation="border" />
                  <p className="mt-2">Loading assessment answers...</p>
                </div>
              ) : (
                hydratedTemplate.sections.map((section, idx) => (
                  <div key={idx} className="mb-4">
                    <h5>{section.title}</h5>
                    {section.questions.map((q, qIdx) => (
                      <div key={qIdx} className="mb-2">
                        <strong>{q.label}</strong>
                        <div>{q.answer || <i className="text-muted">No answer</i>}</div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </Modal.Body>
          </Modal>
        </Card>
      )}
    </>
  );
};

export default ConsentRequestsCard;