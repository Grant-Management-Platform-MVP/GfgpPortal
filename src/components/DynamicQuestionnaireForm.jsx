import React, { useEffect, useState } from "react";
import axios from "axios";
import { Spinner, Container, ProgressBar, Card, Form, Button, Alert } from "react-bootstrap";
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const DynamicQuestionnaireForm = ({ selectedStructure, mode, questionnaireId, tieredLevel }) => {
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
  const [canSubmit, setCanSubmit] = useState(true);
  const [feedbackResolved, setFeedbackResolved] = useState(false);
  const [resolvedFeedbacks, setResolvedFeedbacks] = useState({}); // Stores { questionId: true, ... } for resolved ones
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const navigate = useNavigate();


  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.userId;
  // const structure = localStorage.getItem("gfgpStructure");
  const structure = selectedStructure;
  const FIXED_OPTIONS = ["Yes", "In-progress", "No", "Not Applicable"];
  // const location = useLocation();


  const handleMarkAsResolved = (questionId) => {
    setResolvedFeedbacks(prev => ({
      ...prev,
      [questionId]: true // Mark this specific question's feedback as resolved
    }));
    // Optionally, you might want to trigger a backend update here
    // to persist the resolved status.
    toast.success(`Feedback for question ${questionId} marked as resolved!`);
  };

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
    if (formMode !== 'VIEW_ONLY') {
      setCanSubmit(true);
    }
  }, [answers, formMode]);


  useEffect(() => {
    let isMounted = true;
    const fetchTemplateAndAnswers = async () => {
      if (!userId || !structure) {
        if (isMounted) {
          setError("Missing user or questionnaire structure. Please ensure you are logged in and have selected a questionnaire.");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);

        // 1. Fetch Template First
        let templateApiUrl;
        let tieredParam = null;

        if (structure === 'tiered' && (mode === 'edit' || mode === 'fix')) {
          tieredParam = tieredLevel;
        } else {
          tieredParam = localStorage.getItem('gfgpTieredLevel');
        }

        if (structure === 'tiered' && tieredParam) {
          templateApiUrl = `${BASE_URL}gfgp/questionnaire-templates/structure/${structure}/${tieredParam}`;
        } else {
          templateApiUrl = `${BASE_URL}gfgp/questionnaire-templates/structure/${structure}`;
        }
        const templateRes = await axios.get(templateApiUrl);
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

        // 2. Then, try to fetch Submission or Draft
        let initialAnswers = {};
        let initialSubmissionStatus = null;
        let initialSubmissionId = null;
        let derivedFormMode = "EDIT_DRAFT"; // Default mode
        let initialResolvedFeedbacks = {}; // Initialize here

        // First attempt: Check for a full submission (SUBMITTED, SENT_BACK)
        try {
          const submissionRes = await axios.get(`${BASE_URL}gfgp/assessment-submissions/${userId}/${structure}`);
          // const submissionRes = await axios.get(`${BASE_URL}gfgp/submissions/${questionnaireId}`);
          const submissionData = submissionRes.data[0];

          if (isMounted && submissionData) {
            const status = submissionData.status?.toUpperCase();
            initialSubmissionStatus = status;
            initialSubmissionId = submissionData.id;

            if (status === "SENT_BACK" || status === "SUBMITTED") {
              initialAnswers = normalizeIncomingAnswers(submissionData.answers);
              if (status === "SENT_BACK") {
                derivedFormMode = "FIX_MODE";
                console.log("Submission status is SENT_BACK. Derived mode: FIX_MODE.");
              } else if (status === "SUBMITTED") {
                derivedFormMode = "VIEW_ONLY";
                console.log("Submission status is SUBMITTED. Derived mode: VIEW_ONLY.");
              }
            } else if (status === "SAVED") {
              const rawAnswersString = submissionData.answers;
              if (rawAnswersString) {
                try {
                  initialAnswers = JSON.parse(rawAnswersString);
                  console.log("Parsed SAVED submission answers:", initialAnswers);
                } catch (parseError) {
                  console.error("Failed to parse rawAnswersString from SAVED submission:", parseError, rawAnswersString);
                  initialAnswers = {};
                }
              }
              derivedFormMode = "EDIT_DRAFT";
              console.log(`Submission status is ${status}. Defaulting formMode to EDIT_DRAFT.`);
            }
          }
        } catch (submissionErr) {
          console.warn("No existing submission found or error fetching submission (this is normal if no submission exists):", submissionErr);
        }

        if (Object.keys(initialAnswers).length === 0 && derivedFormMode === "EDIT_DRAFT") {
          console.warn("No answers found in submission, checking for draft...");
          try {

            let assessmentResponseUrl = null;
            let tieredParam = null;

            if (structure === 'tiered' && mode === 'edit') {
              tieredParam = tieredLevel;
            } else {
              tieredParam = localStorage.getItem('gfgpTieredLevel');
            }

            if (structure === 'tiered' && tieredParam) {
              assessmentResponseUrl = `${BASE_URL}gfgp/responses/${userId}/${tieredParam}`;
            } else {
              assessmentResponseUrl = `${BASE_URL}gfgp/assessment-responses/${userId}/${structure}`;
            }

            const draftRes = await axios.get(assessmentResponseUrl);

            if (draftRes.data && draftRes.data.answers) {
              console.log("Draft response found:", draftRes.data);
              const rawAnswersString = draftRes.data.answers;
              if (rawAnswersString) {
                try {
                  // Parse the JSON string from the draft; this will be the flat object.
                  initialAnswers = JSON.parse(rawAnswersString);
                  console.log("Parsed draft answers from assessment-responses:", initialAnswers);
                } catch (parseError) {
                  console.error("Failed to parse rawAnswersString from draft (assessment-responses):", parseError, rawAnswersString);
                  initialAnswers = {};
                }
              } else {
                console.warn("Draft response's 'answers' field is empty or null from assessment-responses.");
                initialAnswers = {};
              }
              derivedFormMode = "EDIT_DRAFT"; // Drafts are always editable
              initialSubmissionStatus = draftRes.data.status?.toUpperCase(); // Should be "SAVED"
              initialSubmissionId = draftRes.data.id;
              console.log("Draft data loaded. Setting formMode to EDIT_DRAFT.");
            } else if (isMounted) {
              console.warn("No draft found in assessment-responses or data is empty — starting fresh.");
              initialAnswers = {};
              derivedFormMode = "EDIT_DRAFT";
            }
          } catch (draftErr) {
            console.warn("Error fetching draft from assessment-responses:", draftErr);
            if (axios.isAxiosError(draftErr) && draftErr.response?.status === 404) {
              if (isMounted) {
                initialAnswers = {};
                derivedFormMode = "EDIT_DRAFT";
                console.log("No draft found (404) in assessment-responses. Starting fresh.");
              }
            } else {
              console.error("Unexpected error fetching draft from assessment-responses:", draftErr);
              if (isMounted) setError(`Failed to load draft data: ${draftErr.response?.data?.message || draftErr.message}`);
            }
          }
        }

        let finalFormMode = derivedFormMode; // Start with the mode derived from fetched data

        // If a 'mode' prop is explicitly provided, it takes precedence.
        // Convert it to uppercase for consistent comparison with internal states.
        if (mode) {
          const normalizedModeProp = mode.toUpperCase();
          if (normalizedModeProp === "EDIT") {
            finalFormMode = "EDIT_DRAFT";
          } else if (normalizedModeProp === "VIEW") {
            finalFormMode = "VIEW_ONLY";
          } else if (normalizedModeProp === "FIX") {
            finalFormMode = "FIX_MODE";
          }
        }

        if (isMounted) {
          setAnswers(initialAnswers);
          setSubmissionStatus(initialSubmissionStatus);
          setSubmissionId(initialSubmissionId);
          setFormMode(finalFormMode)
          setResolvedFeedbacks(initialResolvedFeedbacks);
        }

      } catch (err) {
        console.error("Failed to load questionnaire template or initial data:", err);
        if (isMounted) setError("Failed to load questionnaire template or initial data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTemplateAndAnswers();

    return () => {
      isMounted = false;
    };
  }, [userId, structure, BASE_URL, mode]);

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
      let tieredLevel = null;

      if (structure === 'tiered') {
        tieredLevel = localStorage.getItem('gfgpTieredLevel'); // This should be 'gold', 'silver', etc.
        console.log('tieredLevel', tieredLevel);
      }

      await axios.post(`${BASE_URL}gfgp/assessment-responses/save`, {
        userId,
        structure,
        tieredLevel: structure === 'tiered' ? tieredLevel : null,
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
      navigate('/grantee/assessments');
      setCanSubmit(false);
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

    // if (!hasInteracted && formMode === "EDIT_DRAFT") {
    //   toast.warn("Please interact with the form before submitting.");
    //   return;
    // }

    try {

      let tieredLevel = null;

      if (structure === 'tiered') {
        tieredLevel = localStorage.getItem('gfgpTieredLevel'); // This should be 'gold', 'silver', etc.
        console.log('tieredLevel', tieredLevel);
      }
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
        tieredLevel: structure === 'tiered' ? tieredLevel : null,
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
    const isFeedbackResolvedForThisQuestion = resolvedFeedbacks[question.id];

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
                <a
                  href={`${BASE_URL.replace(/\/+$/, "")}${response.evidence}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-decoration-underline"
                >
                  View uploaded Evidence
                </a>
              </div>
            )}
          </>
        )}
        {/* Display funder feedback prominently when in FIX_MODE */}
        {formMode === "FIX_MODE" && response.funderFeedback && !isFeedbackResolvedForThisQuestion && (
          <Alert variant="info" className="p-2 my-2 h6 text-dark text-secondary">
            <strong>Reviewer Feedback:</strong>
            <p
              className="lead text-success font-weight-bold"
              dangerouslySetInnerHTML={{ __html: response.funderFeedback }}
            />
            <div className="text-end">
              <Button
                variant="warning"
                size="lg"
                onClick={() => handleMarkAsResolved(question.id)}
              >
                Mark as Resolved
              </Button>
            </div>
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

  // --- Wizard Navigation Logic ---
  const totalSections = template.sections.length;
  const isFirstSection = currentSectionIndex === 0;
  const isLastSection = currentSectionIndex === totalSections - 1;

  const handleNextSection = () => {
    if (!isLastSection) {
      setCurrentSectionIndex(prevIndex => prevIndex + 1);
      window.scrollTo(0, 0); // Scroll to top on section change
    }
  };

  const handlePreviousSection = () => {
    if (!isFirstSection) {
      setCurrentSectionIndex(prevIndex => prevIndex - 1);
      window.scrollTo(0, 0); // Scroll to top on section change
    }
  };

  const currentSection = template.sections[currentSectionIndex];

  return (
    <Container className="py-4">
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <h2 className="mb-0">{template.title}</h2>
          <small className="text-muted">Version: {template.version}</small>
          {/* Display current section progress */}
          <p className="mt-2 mb-0">
            Section {currentSectionIndex + 1} of {totalSections}: {currentSection.title}
          </p>
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
        <Alert variant="secondary" className="text-center">
          ⚠️ This assessment has been returned for fixes. Please review funder feedback and make necessary amendments.
        </Alert>
      )}
      {submitted && formMode === "VIEW_ONLY" && (
        <Alert variant="success" className="text-center">🎉 Assessment submitted successfully!</Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <fieldset disabled={formMode === "VIEW_ONLY"}>
          {/* Only render the current section */}
          <Card key={currentSection.sectionId} className="mb-4 shadow-sm">
            <Card.Body>
              <h5 className="text-primary">{currentSection.title}</h5>
              {currentSection.description && (
                <p
                  className="text-muted"
                  dangerouslySetInnerHTML={{ __html: currentSection.description }}
                />
              )}
              {currentSection.subsections?.map(subsection => (
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
        </fieldset>

        <div className="d-flex justify-content-between align-items-center mt-4">
          <Button
            variant="secondary"
            size="lg"
            onClick={handlePreviousSection}
            disabled={isFirstSection || formMode === "VIEW_ONLY"}
          >
            Previous
          </Button>

          {!isLastSection && (
            <Button
              variant="primary"
              size="lg"
              onClick={handleNextSection}
              disabled={formMode === "VIEW_ONLY"}
            >
              Next
            </Button>
          )}

          {isLastSection && formMode !== "VIEW_ONLY" && (
            <Button type="submit" variant="success" size="lg" disabled={saving || !canSubmit}>
              {formMode === "FIX_MODE" ? "Amend & Resubmit" : "Submit"}
            </Button>
          )}
        </div>
      </Form>
    </Container>
  );
};

export default DynamicQuestionnaireForm;