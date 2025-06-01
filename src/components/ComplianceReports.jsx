import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Spinner,
  Card,
  Table,
  Alert,
  OverlayTrigger,
  Tooltip, Modal, Button, Form
} from "react-bootstrap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const STATUS_MAP = {
  Yes: { label: "Met", variant: "success", color: "#198754", points: 2 },
  "In-progress": { label: "Partially Met", variant: "warning", color: "#ffc107", points: 1 },
  No: { label: "Not Met", variant: "danger", color: "#dc3545", points: 0 },
  "Not Applicable": { label: "N/A", variant: "secondary", color: "#6c757d", points: 0 },
  "No Response": { label: "No Response", variant: "light", color: "#f8f9fa", points: 0 }, // Using a very light gray for No Response
};

const ComplianceReports = ({ granteeId: propUserId, structure: propStructure }) => {
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState(null);
  const [responses, setResponses] = useState({});
  const [error, setError] = useState("");
  const [completeness, setCompleteness] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [recommendations, setRecommendations] = useState({});

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  const currentUserId = propUserId || user?.userId;
  console.log('granteeId', currentUserId);
  const currentStructure = propStructure || localStorage.getItem("gfgpStructure");
  const [showSendBackModal, setShowSendBackModal] = useState(false);
  const [sendBackReason, setSendBackReason] = useState("");
  const [hasMissingData, setHasMissingData] = useState(false);
  const [questionnaire, setQuestionnaire] = useState({});
  const [isSendingBack, setIsSendingBack] = useState(false);
  const navigate = useNavigate();


  // Check for missing fields (status, justification, evidence) for each answered question
  const hasUnansweredQuestions = useCallback(() => {
    if (!responses || Object.keys(responses).length === 0) return false;

    return Object.values(responses).some((answer) => {
      // answer is expected to be an object like { answer: "Yes", status, evidence, justification }
      const hasAnswer = !!answer?.answer;
      const isStatusEmpty = !answer?.status;
      const isEvidenceEmpty = !answer?.evidence;
      const isJustificationEmpty = !answer?.justification;

      return hasAnswer && (isStatusEmpty || isEvidenceEmpty || isJustificationEmpty);
    });
  }, [responses]);

  useEffect(() => {
    if (!loading) {
      const missing = hasUnansweredQuestions();
      setHasMissingData(missing);
    }
  }, [loading, hasUnansweredQuestions]);


  // Handler to open modal
  const openSendBackModal = () => setShowSendBackModal(true);
  // Handler to close modal
  const closeSendBackModal = () => {
    setSendBackReason(""); // clear reason on close
    setShowSendBackModal(false);
  };

  // Mock submit handler (replace with real API call)
  const handleSendBackSubmit = async (reason) => {
    if (!reason.trim()) {
      toast.warn("Please provide a reason before sending back.");
      return;
    }

    setIsSendingBack(true);

    try {
      const payload = {
        userId: currentUserId, //sent_by
        reason,
        structure: currentStructure,
        assessmentId: questionnaire?.id,
      };

      const response = await axios.post(`${BASE_URL}gfgp/assessment-submissions/send-back`, payload);

      console.log("Send back response:", response.data);
      closeSendBackModal();
      toast.success("Assessment Report sent back successfully!");
      setTimeout(() => {
        navigate("/grantor/");
      }, 1500);
    } catch (e) {
      console.error("Send back failed:", e);
      toast.error("Failed to send back. Please try again later.");
    } finally {
      setIsSendingBack(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.userId || !currentStructure) {
        setError("Missing user or questionnaire structure. Please ensure you are logged in and have selected a questionnaire.");
        setLoading(false);
        return;
      }

      try {
        const [templateRes, responseRes] = await Promise.all([
          axios.get(`${BASE_URL}gfgp/questionnaire-templates-report/user/${currentUserId}`),
          axios.get(`${BASE_URL}gfgp/assessment-submissions-report/user/${currentUserId}`),
        ]);

        const [templateObj] = templateRes.data;
        const parsedTemplate =
          typeof templateObj.content === "string"
            ? JSON.parse(templateObj.content)
            : templateObj.content;

        let flattenedAnswers = {}; // This will hold our flat answers
        try {
          const raw = responseRes.data.answers;
          const submittedAnswers = typeof raw === "string" ? JSON.parse(raw) : raw || {};

          // Flatten the nested submitted answers structure into a flat object keyed by questionId
          if (submittedAnswers) {
            Object.values(submittedAnswers).forEach(section => {
              if (section && section.subsections) { // Ensure section is not null/undefined
                Object.values(section.subsections).forEach(subsection => {
                  if (subsection && subsection.questions) { // Ensure subsection is not null/undefined
                    Object.entries(subsection.questions).forEach(([questionId, answerData]) => {
                      flattenedAnswers[questionId] = answerData;
                    });
                  }
                });
              }
            });
          }
        } catch (e) {
          console.error("Failed to parse or flatten answers from submission report:", e);
          setError("Error parsing or flattening assessment answers.");
          return;
        }

        setTemplate(parsedTemplate);
        setResponses(flattenedAnswers); // Set the flattened answers to state
        const recMap = {};

        // Fetch recommendations for each section
        await Promise.all(
          (parsedTemplate.sections || []).map(async (section) => {
            try {
              const recRes = await axios.get(`${BASE_URL}gfgp/recommendations/fetch?sectionTitle=${encodeURIComponent(section.title)}`);
              recMap[section.title] = recRes.data || [];
            } catch (err) {
              console.warn(`No recommendations found for ${section.title}`, err);
              recMap[section.title] = [];
            }
          })
        );

        setRecommendations(recMap);

        // Fetch overall completeness and compliance from the submission report
        setCompleteness(responseRes.data.completeness ?? null);
        setCompliance(responseRes.data.compliance ?? null);
        setQuestionnaire(responseRes.data || {});

      } catch (err) {
        console.error("Error fetching data for compliance report:", err);
        setError(`Failed to load compliance report: ${err.message || "Unknown error"}`);
      } finally {
        setLoading(false);
      }

      // Audit logs (only if not a prop-driven view, e.g., for self-assessment)
      if (!propUserId) {
        try {
          await axios.post(`${BASE_URL}gfgp/audit/log`, {
            userId: currentUserId,
            action: "VIEW_COMPLIANCE_REPORT",
            details: "Grantee accessed the compliance report.",
            structure: currentStructure,
          });
        } catch (err) {
          console.warn("Audit log failed:", err.message);
        }
      }
    };

    fetchData();
    // Add currentUserId and currentStructure to dependency array
  }, [BASE_URL, currentUserId, currentStructure, propUserId, user?.userId]);

  // Helper function to get scores for a section
  const getSectionScores = (section) => {
    // Flatten all questions from all subsections within this section
    const allQuestionsInSection = (section.subsections || []).flatMap(
      (subsection) => subsection.questions || []
    );

    const applicableQuestions = allQuestionsInSection.filter(
      (q) => responses[q.id]?.answer !== "Not Applicable"
    );

    const totalPossible = applicableQuestions.length * 2;
    let totalPoints = 0;
    let yesPoints = 0;

    applicableQuestions.forEach((q) => {
      const answer = responses[q.id]?.answer;
      // Get points from STATUS_MAP, default to 0 if answer is not in map or points are undefined
      const points = STATUS_MAP[answer]?.points ?? 0;
      totalPoints += points;
      // Compliance specifically counts 'Yes' points
      if (answer === "Yes") yesPoints += 2;
    });

    // Calculate percentages, handling division by zero
    const completenessPct = totalPossible === 0 ? 0 : (totalPoints / totalPossible) * 100;
    const compliancePct = totalPossible === 0 ? 0 : (yesPoints / totalPossible) * 100;

    return {
      completeness: completenessPct.toFixed(1),
      compliance: compliancePct.toFixed(1),
    };
  };

  // Helper function to prepare data for the chart
  const getChartData = () => {
    if (!template) return [];

    return (template.sections || []).map((section) => {
      // Initialize counts for each status, including 'No Response'
      let counts = { "Met": 0, "Partially Met": 0, "Not Met": 0, "N/A": 0, "No Response": 0 };

      // Flatten all questions from all subsections within this section
      const allQuestionsInSection = (section.subsections || []).flatMap(
        (subsection) => subsection.questions || []
      );

      allQuestionsInSection.forEach((q) => {
        const answer = responses[q.id]?.answer;
        // Get the label for the answer status, defaulting to "No Response" if not found
        const statusLabel = STATUS_MAP[answer]?.label || STATUS_MAP["No Response"].label;
        counts[statusLabel]++;
      });

      return {
        section: section.title,
        ...counts,
      };
    });
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
        <p>Loading compliance report...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div className="mt-4">
      <h4>Sectionwise Compliance Report</h4>
      <div className="flex flex-col items-end gap-2 mt-6">
        {user.role === 'GRANTOR' &&
          questionnaire?.status === 'SUBMITTED' &&
          hasMissingData && (
            <>
              <span className="text-sm text-red-600 font-medium">
                Assessment appears incomplete
              </span>
              <Button variant="warning lg" onClick={openSendBackModal}>
                Send Back Assessment to Grantee
              </Button>
            </>
          )}
      </div>
      <p>
        <strong>Structure:</strong> {currentStructure}
      </p>

      {/* Overall Completeness and Compliance */}
      {completeness !== null && compliance !== null && (
        <Alert variant="info">
          <strong>Completeness:</strong> {completeness}% | {" "}
          <strong>Compliance:</strong> {compliance}%
        </Alert>
      )}

      {/* SECTION TABLES */}
      {(template.sections || []).map((section, index) => {
        const sectionScore = getSectionScores(section);
        return (
          <Card className="mb-4 shadow-sm" key={section.sectionId}>
            <Card.Body>
              <h5>
                {index + 1}. {section.title}
              </h5>
              <p>{section.description}</p>
              <Alert variant="secondary">
                <strong>Section Completeness:</strong> {sectionScore.completeness}% | {" "}
                <strong>Compliance:</strong> {sectionScore.compliance}%
              </Alert>

              {/* Iterate through subsections */}
              {(section.subsections || []).map((subsection) => (
                <div key={subsection.subsectionId} className="mb-3 ps-3 border-start">
                  <h6 className="text-secondary mt-3">{subsection.title}</h6>
                  <Table bordered hover size="sm"> {/* Added size="sm" for compact table */}
                    <thead className="table-light">
                      <tr>
                        <th>Question</th>
                        <th>Status</th>
                        <th>Evidence</th>
                        <th>Justification (if N/A)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Iterate through questions within the current subsection */}
                      {(subsection.questions || []).map((q) => {
                        const response = responses[q.id] || {};
                        const answer = response.answer;
                        // Determine status using STATUS_MAP, defaulting to "No Response"
                        const status = STATUS_MAP[answer] || STATUS_MAP["No Response"];

                        return (
                          <tr key={q.id}>
                            <td>{q.questionText}</td>
                            <td>
                              <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip>{`${status.points} points`}</Tooltip>}
                              >
                                {/* Badge for status, using status.variant for Bootstrap color classes */}
                                <span className={`badge bg-${status.variant}`}>{status.label}</span>
                              </OverlayTrigger>
                            </td>
                            <td>
                              {response.evidence ? (
                                <a
                                  href={`${BASE_URL.replace(/\/+$/, "")}${response.evidence}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  View Evidence
                                </a>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>{response.justification || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              ))}
              {recommendations[section.title]?.length > 0 && (
                <div className="mt-4">
                  <h6 className="text-primary d-flex align-items-center mb-3">
                    <i className="bi bi-lightbulb me-2"></i> {/* Bootstrap icon */}
                    Improvement Recommendations
                  </h6>
                  <div className="list-group">
                    {recommendations[section.title].map((rec, i) => (
                      <div key={i} className="list-group-item">
                        {rec.issueSummary && (
                          <div className="fw-bold text-muted small mb-1">
                            Issue: {rec.issueSummary}
                          </div>
                        )}
                        <div>{rec.recommendationText || <em>No recommendation provided.</em>}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        );
      })}

      {/* STACKED BAR CHART */}
      <Card className="mt-5 shadow-sm">
        <Card.Body>
          <h5 className="mb-3">Visual Summary: Section-wise Compliance Breakdown</h5>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={getChartData()}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="section" width={150} />
              <RechartsTooltip />
              <Legend />
              {/* Bars for each status. Ensure colors match your STATUS_MAP colors */}
              <Bar dataKey="Met" stackId="a" fill={STATUS_MAP.Yes.color} />
              <Bar dataKey="Partially Met" stackId="a" fill={STATUS_MAP["In-progress"].color} />
              <Bar dataKey="Not Met" stackId="a" fill={STATUS_MAP.No.color} />
              <Bar dataKey="N/A" stackId="a" fill={STATUS_MAP["Not Applicable"].color} />
              <Bar dataKey="No Response" stackId="a" fill={STATUS_MAP["No Response"].color} />
            </BarChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>
      {/* Modal */}
      <Modal show={showSendBackModal} onHide={closeSendBackModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Send Back Reason</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="sendBackReason">
            <Form.Label>Please provide a reason</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={sendBackReason}
              onChange={(e) => setSendBackReason(e.target.value)}
              placeholder="Enter reason here..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeSendBackModal}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => handleSendBackSubmit(sendBackReason)} disabled={isSendingBack}>
            {isSendingBack ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" /> Sending...
              </span>
            ) : (
              "Send Back Assessment"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ComplianceReports;