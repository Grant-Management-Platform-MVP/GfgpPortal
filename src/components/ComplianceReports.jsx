import React, { useEffect, useState, useRef } from "react";
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
import html2pdf from 'html2pdf.js';

const STATUS_MAP = {
  Yes: { label: "Met", variant: "success", color: "#198754", points: 2 },
  "In-progress": { label: "Partially Met", variant: "warning", color: "#ffc107", points: 1 },
  No: { label: "Not Met", variant: "danger", color: "#dc3545", points: 0 },
  "Not Applicable": { label: "N/A", variant: "secondary", color: "#6c757d", points: 0 },
  "No Response": { label: "No Response", variant: "light", color: "#f8f9fa", points: 0 },
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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const navigate = useNavigate();
  const { tieredLevel } = useParams();

  const reportRef = useRef(null);

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  const currentUserId = propUserId || user?.userId;
  const currentStructure = propStructure || localStorage.getItem("gfgpStructure");
  const isGrantor = user?.role === 'GRANTOR';
  const isGrantee = user?.role === 'GRANTEE';

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.userId) {
        setError("Missing user, GFGP structure or assessment. Please ensure you are logged in and have selected a questionnaire.");
        setLoading(false);
        return;
      }

      try {
        const responseRes = await axios.get(`${BASE_URL}gfgp/assessment-submissions-report/user/${currentUserId}`);
        const assessmentSubmission = responseRes.data;

        if (!assessmentSubmission || !assessmentSubmission.answers) {
          setError("No submitted assessment found for this user or assessment is incomplete.");
          setLoading(false);
          return;
        }

        const submissionStructure = assessmentSubmission.structure;
        const submissionTieredLevel = assessmentSubmission.tieredLevel;

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
        setError(`Failed to load compliance report: ${err.response?.data?.message || err.message || "No matching questionnaire template found for the specified structure and tiered level"}`);
      } finally {
        setLoading(false);
      }

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
  }, [BASE_URL, currentUserId, currentStructure, propUserId, user?.userId]);

  const handleFunderCommentChange = (questionId, value) => {
    setFunderComments(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleReturnForFixes = async () => {
    setIsSubmittingFeedback(true);
    setError("");

    try {
      if (!questionnaire || !questionnaire.id) {
        throw new Error("Assessment submission ID is missing. Cannot return for fixes.");
      }

      const updatedAnswersForBackend = { sections: {} };

      template.sections.forEach(section => {
        updatedAnswersForBackend.sections[section.sectionId] = {
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
            const granteeResponse = responses[qId] || {};
            const funderComment = funderComments[qId] || '';

            updatedAnswersForBackend.sections[section.sectionId].subsections[subsection.subsectionId].questions[qId] = {
              id: qId,
              answer: granteeResponse.answer,
              evidence: granteeResponse.evidence,
              justification: granteeResponse.justification,
              ...(funderComment.trim() !== '' && { funderFeedback: funderComment.trim() })
            };
          });
        });
      });

      await axios.put(`${BASE_URL}gfgp/assessment-submissions/${questionnaire.id}/return-for-fixes`, {
        funderId: user?.userId,
        updatedAnswers: updatedAnswersForBackend,
        granteeId: currentUserId
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

  const getSectionScores = (section) => {
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
      const points = STATUS_MAP[answer]?.points ?? 0;
      totalPoints += points;
      if (answer === "Yes") yesPoints += 2;
    });

    const completenessPct = totalPossible === 0 ? 0 : (totalPoints / totalPossible) * 100;
    const compliancePct = totalPossible === 0 ? 0 : (yesPoints / totalPossible) * 100;

    return {
      completeness: completenessPct.toFixed(1),
      compliance: compliancePct.toFixed(1),
    };
  };

  const getChartData = () => {
    if (!template) return [];

    return (template.sections || []).map((section) => {
      let counts = { "Met": 0, "Partially Met": 0, "Not Met": 0, "N/A": 0, "No Response": 0 };

      const allQuestionsInSection = (section.subsections || []).flatMap(
        (subsection) => subsection.questions || []
      );

      allQuestionsInSection.forEach((q) => {
        const answer = responses[q.id]?.answer;
        const statusLabel = STATUS_MAP[answer]?.label || STATUS_MAP["No Response"].label;
        counts[statusLabel]++;
      });

      return {
        section: section.title,
        ...counts,
      };
    });
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true); // Set state to hide buttons before generation
    setError("");

    try {
      if (!reportRef.current) {
        throw new Error("Report content not found for PDF generation.");
      }

      const element = reportRef.current;
      const pdfFileName = `Compliance_Report_${questionnaire?.granteeName || 'UnknownGrantee'}_${new Date().toLocaleDateString()}.pdf`;

      const options = {
        margin: [10, 10, 10, 10],
        filename: pdfFileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      await html2pdf().from(element).set(options).save();
      toast.success("Report downloaded successfully as PDF!");
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError(`Failed to generate PDF: ${err.message}`);
      toast.error(`Failed to generate PDF: ${err.message}`);
    } finally {
      setIsGeneratingPdf(false); // Reset state after generation
    }
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

  const isAlreadyReturned = questionnaire?.status === 'RETURNED_FOR_FIXES';

  return (
    <div className="mt-4">
      {/* Attach the ref to the parent div that wraps all the content you want in the PDF */}
      {/* This div WILL be converted to PDF. The buttons below are OUTSIDE this ref. */}
      <div ref={reportRef}> {/* This div contains the content for PDF */}
        <div ref={reportRef}> {/* This div contains the content for PDF, ensure it has a closing tag below */}
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
                      <Table bordered hover size="sm">
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
                          {(subsection.questions || []).map((q) => {
                            const response = responses[q.id] || {};
                            const answer = response.answer;
                            const status = STATUS_MAP[answer] || STATUS_MAP["No Response"];

                            return (
                              <tr key={q.id}>
                                <td><p className="text-muted" dangerouslySetInnerHTML={{ __html: q.questionText }} /></td>
                                <td>
                                  <OverlayTrigger
                                    placement="top"
                                    overlay={<Tooltip>{`${status.points} points`}</Tooltip>}
                                  >
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
                                  {/* Conditionally render ReactQuill or plain text for PDF */}
                                  {isGeneratingPdf ? ( // If PDF is being generated, show plain text
                                    <div dangerouslySetInnerHTML={{ __html: funderComments[q.id] || '' }} />
                                  ) : ( // Otherwise, show the interactive ReactQuill editor
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
                                  )}
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
                        <i className="bi bi-lightbulb me-2"></i>
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
                  <Bar dataKey="Met" stackId="a" fill={STATUS_MAP.Yes.color} />
                  <Bar dataKey="Partially Met" stackId="a" fill={STATUS_MAP["In-progress"].color} />
                  <Bar dataKey="Not Met" stackId="a" fill={STATUS_MAP.No.color} />
                  <Bar dataKey="N/A" stackId="a" fill={STATUS_MAP["Not Applicable"].color} />
                  <Bar dataKey="No Response" stackId="a" fill={STATUS_MAP["No Response"].color} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </div> {/* End of div with ref={reportRef} */}
      </div>

      {/* Buttons: Rendered OUTSIDE the ref, so they are not captured in the PDF */}
      <div className="text-end d-grid gap-2 mt-4">
        {isGrantor && (
          <Button
            variant="success"
            size="lg"
            onClick={handleReturnForFixes}
            disabled={isSubmittingFeedback || isAlreadyReturned || isGeneratingPdf}
          >
            {isSubmittingFeedback ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Returning...
              </>
            ) : isAlreadyReturned ? (
              "Assessment Already Returned"
            ) : (
              "Return Assessment to Grantee for Fixes"
            )}
          </Button>
        )}
        <Button
          variant="primary"
          size="lg"
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf || loading}
        >
          {isGeneratingPdf ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
              Generating PDF...
            </>
          ) : (
            "Download Report as PDF"
          )}
        </Button>
      </div>
    </div>
  );
};
export default ComplianceReports;