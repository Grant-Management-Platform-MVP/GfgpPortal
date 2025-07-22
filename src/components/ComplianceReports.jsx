import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Spinner,
  Card,
  Table,
  Alert,
  OverlayTrigger,
  Tooltip, Button, Form
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
import { useNavigate, useParams } from "react-router-dom";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const STATUS_MAP = {
  Yes: { label: "Met", variant: "success", color: "#198754", points: 2 },
  "In-progress": { label: "Partially Met", variant: "warning", color: "#ffc107", points: 1 },
  No: { label: "Not Met", variant: "danger", color: "#dc3545", points: 0 },
  "Not Applicable": { label: "N/A", variant: "secondary", color: "#6c757d", points: 0 },
  "No Response": { label: "No Response", variant: "light", color: "#f8f9fa", points: 0 }, // Using a very light gray for No Response
};

const ComplianceReports = ({ granteeId: propUserId, structure: propStructure, id: propAssessmentId }) => {
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState(null);
  const [responses, setResponses] = useState({});
  const [error, setError] = useState("");
  const [completeness, setCompleteness] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [recommendations, setRecommendations] = useState({});
  const [funderComments, setFunderComments] = useState({});
  const [questionnaire, setQuestionnaire] = useState({});
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const navigate = useNavigate();
  // const [currentSubmission, setCurrentSubmission] = useState(null);
   const {tieredLevel} = useParams();


  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  const currentUserId = propUserId || user?.userId;
  const currentStructure = propStructure || localStorage.getItem("gfgpStructure");
  // const currentAssessmentId = propAssessmentId;
  const isGrantor = user?.role === 'GRANTOR'; // case-sensitive match
  const isGrantee = user?.role === 'GRANTEE'; // case-sensitive match

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.userId) {
        setError("Missing user, GFGP structure or assessment. Please ensure you are logged in and have selected a questionnaire.");
        setLoading(false);
        return;
      }

      try {
        // Fetch the assessment submission first to get its exact structure and tieredLevel
        const responseRes = await axios.get(`${BASE_URL}gfgp/assessment-submissions-report/user/${currentUserId}`);
        const assessmentSubmission = responseRes.data;

        if (!assessmentSubmission || !assessmentSubmission.answers) {
          setError("No submitted assessment found for this user or assessment is incomplete.");
          setLoading(false);
          return;
        }

        // Determine the structure and tieredLevel from the fetched assessment submission
        const submissionStructure = assessmentSubmission.structure;
        const submissionTieredLevel = assessmentSubmission.tieredLevel; // Will be null for non-tiered structures

        // Now fetch the template using the exact structure and tieredLevel of the submission
        const templateRes = await axios.get(
            `${BASE_URL}gfgp/questionnaire-templates-report/user/${currentUserId}`,
            {
                params: {
                    structure: submissionStructure,
                    tieredLevel: submissionTieredLevel
                }
            }
        );

        const templateObj = templateRes.data;

        if (!templateObj?.content) {
          setError("The questionnaire template is missing content.");
          return;
        }

        const parsedTemplate =
          typeof templateObj.content === "string"
            ? JSON.parse(templateObj.content)
            : templateObj.content;

        let flattenedAnswers = {};
        try {
          const raw = assessmentSubmission.answers;
          const submittedAnswers = typeof raw === "string" ? JSON.parse(raw) : raw || {};
          if (submittedAnswers) {
            Object.values(submittedAnswers).forEach(section => {
              if (section?.subsections) {
                Object.values(section.subsections).forEach(subsection => {
                  if (subsection?.questions) {
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
        setResponses(flattenedAnswers);

        const initialFunderComments = {};
        Object.keys(flattenedAnswers).forEach(qId => {
          if (flattenedAnswers[qId].funderFeedback) {
            initialFunderComments[qId] = flattenedAnswers[qId].funderFeedback;
          }
        });
        setFunderComments(initialFunderComments);

        const recMap = {};
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
        setCompleteness(assessmentSubmission.completeness ?? null);
        setCompliance(assessmentSubmission.compliance ?? null);
        setQuestionnaire(assessmentSubmission || {});

      } catch (err) {
        console.error("Error fetching data for compliance report:", err);
        setError(`Failed to load compliance report: ${"No matching questionnaire template found for the specified structure and tiered level"}`);
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


  // Handles changes in funder feedback textareas
  const handleFunderCommentChange = (questionId, value) => {
    setFunderComments(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Handles the "Return to Grantee for Fixes" action
  const handleReturnForFixes = async () => {
    setIsSubmittingFeedback(true);
    setError(""); // Clear previous errors

    try {
      if (!questionnaire || !questionnaire.id) {
        throw new Error("Assessment submission ID is missing. Cannot return for fixes.");
      }

      // 1. Reconstruct the full nested answers object with funder feedback
      const updatedAnswersForBackend = { sections: {} };

      template.sections.forEach(section => {
        updatedAnswersForBackend.sections[section.sectionId] = {
          // Re-include basic section/subsection info if backend requires it
          sectionId: section.sectionId,
          title: section.title,
          subsections: {}
        };
        section.subsections.forEach(subsection => {
          updatedAnswersForBackend.sections[section.sectionId].subsections[subsection.subsectionId] = {
            subsectionId: subsection.subsectionId,
            title: subsection.title,
            questions: {}
          };
          subsection.questions.forEach(question => {
            const qId = question.id;
            const granteeResponse = responses[qId] || {}; // Grantee's original answer data
            const funderComment = funderComments[qId] || ''; // Funder's typed comment

            updatedAnswersForBackend.sections[section.sectionId].subsections[subsection.subsectionId].questions[qId] = {
              id: qId,
              answer: granteeResponse.answer,
              evidence: granteeResponse.evidence,
              justification: granteeResponse.justification,
              // Add funderFeedback only if it's not empty, otherwise omit (or set to null)
              ...(funderComment.trim() !== '' && { funderFeedback: funderComment.trim() })
            };
          });
        });
      });

      await axios.put(`${BASE_URL}gfgp/assessment-submissions/${questionnaire.id}/return-for-fixes`, {
        funderId: user?.userId, // The ID of the funder performing the action
        updatedAnswers: updatedAnswersForBackend, // Send the full, updated answers object
        granteeId: currentUserId // The ID of the grantee to whom this assessment belongs
      });

      toast.success("Assessment returned to grantee for fixes!");
      setTimeout(() => {
        navigate("/grantor/shared-reports");
      }, 1500);
    } catch (err) {
      console.error("Error returning assessment:", err);
      setError(`Failed to return assessment: ${err.response?.data?.message || err.message}`);
      toast.error(`Failed to return assessment: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };


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

  // Determine if the assessment is already in 'RETURNED_FOR_FIXES' status
  const isAlreadyReturned = questionnaire?.status === 'RETURNED_FOR_FIXES';

  return (
    <div className="mt-4">
      <h4>Sectionwise Compliance Report</h4>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      <p>
        <strong>Grantee:</strong> {questionnaire?.granteeName} <br />
        <strong>Current Status:</strong> {questionnaire?.status} <br />
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
              <p className="text-muted" dangerouslySetInnerHTML={{ __html: section.description }} />
              <Alert variant="secondary">
                <strong>Section Completeness:</strong> {sectionScore.completeness}% | {" "}
                <strong>Compliance:</strong> {sectionScore.compliance}%
              </Alert>

              {/* Iterate through subsections */}
              {(section.subsections || []).map((subsection) => (
                <div key={subsection.subsectionId} className="mb-3 ps-3 border-start">
                  <h6 className="text-muted" dangerouslySetInnerHTML={{ __html: subsection.title }} />
                  <Table bordered hover size="sm"> {/* Added size="sm" for compact table */}
                    <thead className="table-light">
                      <tr>
                        <th>Question</th>
                        <th>Status</th>
                        <th>Evidence</th>
                        <th>Justification (if N/A)</th>
                        {isGrantor && <th>Funder Feedback</th>}
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
                            <td><p className="text-muted" dangerouslySetInnerHTML={{ __html: q.questionText }} /></td>
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
                            {isGrantor && <td>
                              <ReactQuill
                                style={{ minHeight: "110px", marginBottom: "1rem" }}
                                className="mb-2"
                                theme="snow"
                                placeholder="Add feedback here..."
                                value={funderComments[q.id] || ''}
                                onChange={(content) => handleFunderCommentChange(q.id, content)}
                                disabled={isSubmittingFeedback || isAlreadyReturned}
                                modules={{
                                  toolbar: [
                                    [{ header: [1, 2, false] }],
                                    ['bold', 'italic', 'underline'],
                                    [{ list: 'ordered' }, { list: 'bullet' }],
                                    ['link'],
                                  ],
                                }}
                              />
                            </td>}
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              ))}
              {isGrantee && recommendations[section.title]?.length > 0 && (
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
      <div className="text-end d-grid gap-2 mt-4">
        {isGrantor && (
          <Button
            variant="success"
            size="lg"
            onClick={handleReturnForFixes}
            // Disable if already returning, or if the assessment is already in the 'RETURNED_FOR_FIXES' state
            disabled={isSubmittingFeedback || isAlreadyReturned}
          >
            {isSubmittingFeedback ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Returning...
              </>
            ) : isAlreadyReturned ? (
              "Assessment Already Returned"
            ) : (
              "Return Assessement to Grantee for Fixes"
            )}
          </Button>)}
      </div>
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
    </div>
  );
};

export default ComplianceReports;