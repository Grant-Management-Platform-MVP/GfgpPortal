import React, { useEffect, useState } from "react";
import axios from "axios";
import { Spinner, Container, ProgressBar, Card, Form, Button, Alert } from "react-bootstrap";
import { toast } from 'react-toastify';
// import { useLocation } from 'react-router-dom';

const DynamicQuestionnaireForm = ({ selectedStructure, mode }) => {
  const [template, setTemplate] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [formMode, setFormMode] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.userId;
  // const structure = localStorage.getItem("gfgpStructure");
  const structure = selectedStructure;
  const FIXED_OPTIONS = ["Yes", "In-progress", "No", "Not Applicable"];
  // const location = useLocation();


  const normalizeIncomingAnswers = (incomingAnswersRaw) => {
    const normalized = {};
    let parsedIncoming;
    try {
      parsedIncoming = typeof incomingAnswersRaw === "string"
        ? JSON.parse(incomingAnswersRaw)
        : incomingAnswersRaw;

    } catch (e) {
      console.error("Failed to parse incoming answers JSON:", e, incomingAnswersRaw);
      return {};
    }

    if (parsedIncoming && parsedIncoming.sections) {
      Object.values(parsedIncoming.sections).forEach(section => {
        if (section.subsections) {
          Object.values(section.subsections).forEach(subsection => {
            if (subsection.questions) {
              Object.entries(subsection.questions).forEach(([questionId, answerData]) => {
                normalized[questionId] = {
                  answer: answerData?.answer !== undefined && answerData?.answer !== null ? String(answerData.answer) : "",
                  justification: answerData?.justification,
                  evidence: answerData?.evidence,
                  funderFeedback: answerData?.funderFeedback,
                };
              });
            }
          });
        }
      });
    }
    return normalized;
  };

  useEffect(() => {
    let isMounted = true;

    if (!userId || !structure) {
      if (isMounted) {
        setError("Missing user or questionnaire structure. Please ensure you are logged in and have selected a questionnaire.");
        setLoading(false);
      }
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const templateRes = await axios.get(`${BASE_URL}gfgp/questionnaire-templates/structure/${structure}`);
        const [templateObj] = templateRes.data;
        if (!templateObj || !templateObj.content) throw new Error("Template content missing.");
        const parsedContent = typeof templateObj.content === "string" ? JSON.parse(templateObj.content) : templateObj.content;

        if (isMounted) {
          setTemplate({
            ...parsedContent,
            title: templateObj.title,
            version: templateObj.version,
            templateCode: templateObj.templateCode,
          });
        }

        try {
          const submissionRes = await axios.get(`${BASE_URL}gfgp/assessment-submissions/${userId}/${structure}`);
          const submissionData = submissionRes.data[0];

          if (!submissionData) {
            // No submission found - try loading draft or start fresh
            if (isMounted) {
              await fetchDraftData(isMounted);
            }
            return; // exit so no crash happens below
          }

          const status = submissionData.status?.toUpperCase();
          if (isMounted) {
            setAnswers(normalizeIncomingAnswers(submissionData.answers));
            setSubmissionStatus(status);
            setSubmissionId(submissionData.id);
            if (status === "SENT_BACK") {
              setFormMode("FIX_MODE");
              console.log("Submission status is SENT_BACK. Setting formMode to FIX_MODE.");
            } else if (status === "SUBMITTED") {
              setFormMode("VIEW_ONLY");
              console.log("Submission status is SUBMITTED. Setting formMode to VIEW_ONLY.");
            } else {
              setFormMode("EDIT_DRAFT");
              console.log(`Submission status is ${status}. Defaulting formMode to EDIT_DRAFT.`);
            }
          }
        } catch (submissionErr) {
          console.warn("No existing submission found (or error fetching submission). Checking for draft.");
          if (axios.isAxiosError(submissionErr) && submissionErr.response?.status === 404) {
            await fetchDraftData(isMounted);
          } else {
            console.error("Error fetching submission status:", submissionErr);
            if (isMounted) setError(`Failed to load submission data: ${submissionErr.response?.data?.message || submissionErr.message}`);
          }
        }

      } catch (err) {
        console.error("Failed to load questionnaire template or initial data:", err);
        if (isMounted) setError("Failed to load questionnaire template or initial data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const fetchDraftData = async (isMountedFlag) => {
      try {
        const draftRes = await axios.get(`${BASE_URL}gfgp/assessment-responses/${userId}/${structure}`);
        if (isMountedFlag) {
          if (draftRes.data) {
            console.log("Draft response found:", draftRes.data);
            const rawAnswers = draftRes.data.answers || {};
            const parsedAnswers = typeof rawAnswers === "string" ? JSON.parse(rawAnswers) : rawAnswers;
            const normalizedDraft = {};
            for (const [qid, value] of Object.entries(parsedAnswers)) {
              normalizedDraft[qid] = typeof value === "object" ? value : { answer: value !== undefined && value !== null ? String(value) : "" };
            }
            setAnswers(normalizedDraft);
            setSubmissionStatus(null);
            setFormMode("EDIT_DRAFT");
            console.log("Draft data loaded. Setting formMode to EDIT_DRAFT.");
          } else {
            console.warn("Draft response is null — starting fresh.");
            setAnswers({});
            setFormMode("EDIT_DRAFT");
          }
        }
      } catch (draftErr) {
        console.warn("No draft found or error fetching draft:", draftErr);
        if (axios.isAxiosError(draftErr) && draftErr.response?.status === 404) {
          if (isMountedFlag) {
            setAnswers({});
            setSubmissionStatus(null);
            setFormMode("EDIT_DRAFT");
            console.log("No draft found (404). Starting fresh in EDIT_DRAFT mode.");
          }
        } else {
          console.error("Unexpected error fetching draft:", draftErr);
          if (isMountedFlag) setError(`Failed to load draft data: ${draftErr.response?.data?.message || draftErr.message}`);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [userId, structure, BASE_URL]);

  useEffect(() => {
    if (mode === "view") {
      setFormMode("VIEW_ONLY");
    } else if (mode === "fix") {
      setFormMode("FIX_MODE");
    } else if (submissionStatus === "SENT_BACK") {
      setFormMode("FIX_MODE");
    } else if (submissionStatus === "SUBMITTED") {
      setFormMode("VIEW_ONLY");
    } else {
      setFormMode("EDIT_DRAFT");
    }
  }, [mode, submissionStatus]);



  useEffect(() => {
    if (!template || !hasInteracted || formMode === "VIEW_ONLY") return;
    const debounceSave = setTimeout(() => {
      saveDraft();
    }, 60000); // 1 minute

    return () => clearTimeout(debounceSave);
  }, [answers, template, hasInteracted, formMode]);

  const saveDraft = async () => {
    setSaving(true);
    try {
      await axios.post(`${BASE_URL}gfgp/assessment-responses/save`, {
        userId,
        templateCode: template.templateCode,
        version: template.version,
        answers: Object.fromEntries(
          Object.entries(answers).map(([qid, ansObj]) => {
            const { funderFeedback: _, ...rest } = ansObj;
            return [qid, rest];
          })
        ),
      });
      setLastSaved(new Date());
      toast.success("Draft saved!");
    } catch (err) {
      console.error("Failed to save draft", err);
      toast.error("Failed to save draft.");
    } finally {
      setSaving(false);
    }
  };

  const shouldShowQuestion = question => {
    if (!question.conditional) return true;
    const { questionId, showIf } = question.conditional;
    return showIf.includes(answers[questionId]?.answer);
  };

  const handleFileUpload = async (file, questionId) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);
    formData.append("questionId", questionId);

    try {
      const res = await axios.post(`${BASE_URL}gfgp/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const { fileUrl } = res.data;

      setAnswers((prev) => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          evidence: fileUrl,
        },
      }));
    } catch (err) {
      console.error("Upload failed", err);
      toast.error("File upload failed. Try again.");
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (formMode === "VIEW_ONLY") {
      toast.warn("This assessment is in view-only mode and cannot be submitted.");
      return;
    }

    if (!hasInteracted && formMode === "EDIT_DRAFT") {
      toast.warn("Please interact with the form before submitting.");
      return;
    }

    try {
      const answersForSubmission = Object.fromEntries(
        Object.entries(answers).map(([qid, ansObj]) => {
          const { funderFeedback: _, ...rest } = ansObj;
          return [qid, rest];
        })
      );

      const structuredAnswers = structureAnswers(answersForSubmission, template);

      const submissionPayload = {
        userId,
        structure,
        tieredLevel: structure === 'tiered' ? template.tieredLevel : null,
        version: template.version,
        answers: structuredAnswers,
      };

      if (formMode === "FIX_MODE") {
        // PUT for resubmission
        await axios.put(`${BASE_URL}gfgp/assessment-submissions/${submissionId}/resubmit`, submissionPayload);
        toast.success("Assessment re-submitted successfully!");
      } else {
        await axios.post(`${BASE_URL}gfgp/assessment-responses/submit`,
          submissionPayload
        );
        toast.success("Assessment submitted successfully!");
      }

      setSubmitted(true);
      setFormMode("VIEW_ONLY");

      // Strip funderFeedback after successful submission
      setAnswers(prevAnswers => {
        const newAnswers = { ...prevAnswers };
        for (const qid in newAnswers) {
          delete newAnswers[qid].funderFeedback;
        }
        return newAnswers;
      });

    } catch (err) {
      console.error("Submission error:", err);
      const message = err.response?.data?.message || err.message;
      setError(`Failed to submit your responses: ${message}`);
      toast.error(`Failed to submit: ${message}`);
    }
  };


  const structureAnswers = (flatAnswers, template) => {
    const structured = {};
    template.sections.forEach(section => {
      structured[section.sectionId] = {
        sectionTitle: section.title,
        subsections: {}
      };
      (section.subsections || []).forEach(subsection => {
        structured[section.sectionId].subsections[subsection.subsectionId] = {
          subsectionTitle: subsection.title,
          questions: {}
        };
        (subsection.questions || []).forEach(question => {
          const questionId = question.id;
          if (flatAnswers[questionId]) {
            structured[section.sectionId].subsections[subsection.subsectionId].questions[questionId] = flatAnswers[questionId];
          }
        });
        if (Object.keys(structured[section.sectionId].subsections[subsection.subsectionId].questions).length === 0) {
          delete structured[section.sectionId].subsections[subsection.subsectionId];
        }
      });
      if (Object.keys(structured[section.sectionId].subsections).length === 0) {
        delete structured[section.sectionId];
      }
    });
    return structured;
  };

  const renderInput = (question) => {
    const disabled = formMode === "VIEW_ONLY";
    const response = answers[question.id] || {};

    const handleAnswerChange = (value) => {
      setHasInteracted(true);
      setAnswers((prev) => {
        const newState = {
          ...prev,
          [question.id]: {
            ...prev[question.id],
            answer: value,
          },
        };
        if (value !== "Not Applicable" && prev[question.id]?.answer === "Not Applicable") {
          delete newState[question.id].justification;
        }
        if (value !== "Yes" && prev[question.id]?.answer === "Yes") {
          delete newState[question.id].evidence;
        }
        return newState;
      });
    };

    return (
      <>
        {FIXED_OPTIONS.map((opt) => (
          <Form.Check
            key={opt}
            type="radio"
            id={`question-${question.id}-${opt}`}
            name={question.id}
            label={opt}
            value={opt}
            checked={response.answer === opt}
            onChange={(e) => handleAnswerChange(e.target.value)}
            disabled={disabled}
          />
        ))}

        {response.answer === "Not Applicable" && (
          <Form.Control
            as="textarea"
            rows={2}
            placeholder="Provide justification for N/A"
            value={response.justification || ""}
            onChange={(e) =>
              setAnswers((prev) => ({
                ...prev,
                [question.id]: {
                  ...prev[question.id],
                  justification: e.target.value,
                },
              }))
            }
            className="mt-2"
            disabled={disabled}
          />
        )}

        {response.answer === "Yes" && question.uploadEvidence && (
          <>
            <Form.Control
              type="file"
              className="mt-2"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  handleFileUpload(file, question.id);
                  e.target.value = null;
                }
              }}
              disabled={disabled}
            />
            {response.evidence && (
              <div className="mt-2">
                <a href={response.evidence} target="_blank" rel="noreferrer" className="text-decoration-underline">
                  View uploaded evidence
                </a>
              </div>
            )}
          </>
        )}
        {/* Display funder feedback prominently when in FIX_MODE */}
        {formMode === "FIX_MODE" && response.funderFeedback && (
          <Alert variant="warning" className="p-2 my-2 small">
            <strong>Funder Feedback:</strong> {response.funderFeedback}
          </Alert>
        )}
      </>
    );
  };

  if (!userId || !structure) {
    return (
      <Container className="mt-5 text-center">
        <Alert variant="danger">Missing user or structure. Please log in properly or ensure a questionnaire is selected.</Alert>
      </Container>
    );
  }

  if (loading || !template || !formMode) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
        <p>Initializing your assessment questionnaire...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5 text-center">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  // Progress bar calculation
  const allVisibleQuestions = template.sections
    .flatMap(section => section.subsections || [])
    .flatMap(subsection => subsection.questions || [])
    .filter(question => shouldShowQuestion(question));


  const answeredCount = allVisibleQuestions.filter(
    (q) => answers[q.id]?.answer && answers[q.id]?.answer !== ""
  ).length;

  const progress = allVisibleQuestions.length > 0 ? Math.round((answeredCount / allVisibleQuestions.length) * 100) : 100;

  return (
    <Container className="py-4">
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <h2 className="mb-0">{template.title}</h2>
          <small className="text-muted">Version: {template.version}</small>
        </Card.Body>
        <ProgressBar now={progress} label={`${progress}% completed`} />
      </Card>

      {(formMode === "EDIT_DRAFT" || formMode === "FIX_MODE") && (
        <div className="row mb-3">
          <div className="col-md-6">
            <button
              onClick={saveDraft}
              disabled={saving || formMode === "VIEW_ONLY"}
              className="btn btn-warning btn-lg mb-4"
            >
              {saving ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                  Saving...
                </>
              ) : (
                "Save Draft"
              )}
            </button>
          </div>
          <div className="col-md-6 d-flex align-items-center">
            {lastSaved && (
              <small className="text-muted ms-auto">
                Draft saved at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </small>
            )}
          </div>
        </div>
      )}

      {formMode === "VIEW_ONLY" && (
        <Alert variant="info" className="text-center">
          🔒 This assessment has been submitted and is under review. You can no longer make changes.
        </Alert>
      )}
      {formMode === "FIX_MODE" && (
        <Alert variant="warning" className="text-center">
          ⚠️ This assessment has been returned for fixes. Please review funder feedback and make necessary amendments.
        </Alert>
      )}
      {submitted && formMode === "VIEW_ONLY" && (
        <Alert variant="success" className="text-center">🎉 Assessment submitted successfully!</Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <fieldset disabled={formMode === "VIEW_ONLY"}>
          {template.sections.map(section => (
            <Card key={section.sectionId} className="mb-4 shadow-sm">
              <Card.Body>
                <h5 className="text-primary">{section.title}</h5>
                {section.description && (
                  <p
                    className="text-muted"
                    dangerouslySetInnerHTML={{ __html: section.description }}
                  />
                )}
                {section.subsections?.map(subsection => (
                  <div key={subsection.subsectionId} className="mb-3 ps-3 border-start">
                    <h6 className="text-secondary">{subsection.title}</h6>
                    {subsection.description && (
                      <p
                        className="text-muted"
                        dangerouslySetInnerHTML={{ __html: subsection.description }}
                      />
                    )}
                    {subsection.questions?.map(q => (
                      shouldShowQuestion(q) && (
                        <Form.Group key={q.id} className="mb-4">
                          <Form.Label className="fw-semibold fs-6 d-inline-flex align-items-center gap-1">
                            <span dangerouslySetInnerHTML={{ __html: q.questionText }} />
                            {q.required}
                          </Form.Label>
                          {q.guidance && (
                            <div className="text-muted small mt-2" dangerouslySetInnerHTML={{ __html: q.guidance }} />
                          )}
                          {renderInput(q)}
                        </Form.Group>
                      )
                    ))}
                  </div>
                ))}
              </Card.Body>
            </Card>
          ))}
        </fieldset>

        <div className="text-end d-grid gap-2">
          {formMode !== "VIEW_ONLY" && (
            <Button type="submit" variant="success" size="lg" disabled={saving}>
              {formMode === "FIX_MODE" ? "Amend & Resubmit" : "Submit"}
            </Button>
          )}
        </div>
      </Form>
    </Container>
  );
};

export default DynamicQuestionnaireForm;