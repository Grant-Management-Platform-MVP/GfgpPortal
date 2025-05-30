import React, { useEffect, useState } from "react";
import axios from "axios";
import { Spinner, Container, ProgressBar, Card, Form, Button, Alert } from "react-bootstrap";
import { toast } from 'react-toastify';

const DynamicQuestionnaireForm = () => {
  const [template, setTemplate] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);


  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.userId;
  const structure = localStorage.getItem("gfgpStructure");
  const FIXED_OPTIONS = ["Yes", "In-progress", "No", "Not Applicable"];

  useEffect(() => {
    let isMounted = true;

    if (!userId || !structure) {
      if (isMounted) {
        setError("Missing user or questionnaire structure. Please ensure you are logged in and have selected a questionnaire.");
        setLoading(false);
      }
      return;
    }

    const normalizeAnswers = (draftAnswers) => {
      const normalized = {};
      for (const [qid, value] of Object.entries(draftAnswers)) {
        normalized[qid] =
          typeof value === "object" ? value : { answer: value };
      }
      return normalized;
    };

    const fetchTemplateAndDraft = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${BASE_URL}gfgp/questionnaire-templates/structure/${structure}`);
        const [templateObj] = res.data;
        if (!templateObj || !templateObj.content) throw new Error("Template content missing.");
        const parsedContent = typeof templateObj.content === "string" ? JSON.parse(templateObj.content) : templateObj.content;

        if (isMounted) {
          setTemplate({
            ...parsedContent,
            title: templateObj.title,
            version: templateObj.version,
          });
        }

        // 🔒 First check if form is submitted
        try {
          const submissionStatusRes = await axios.get(`${BASE_URL}gfgp/assessment-submissions/${userId}/${structure}`);
          const status = submissionStatusRes.data?.status?.toUpperCase();
          if (status === "SUBMITTED") {
            if (isMounted) setIsLocked(true);

            const submittedAnswers = submissionStatusRes.data.answers;
            // The backend should ideally store answers in the same structure as structuredAnswers
            const parsedSubmitted = typeof submittedAnswers === "string"
              ? JSON.parse(submittedAnswers)
              : submittedAnswers;

            // Flatten submitted answers for the answers state
            const flattenedSubmitted = {};
            if (parsedSubmitted) {
                // Iterate through the nested structure to flatten it
                Object.values(parsedSubmitted).forEach(section => {
                    if (section.subsections) {
                        Object.values(section.subsections).forEach(subsection => {
                            if (subsection.questions) {
                                Object.entries(subsection.questions).forEach(([questionId, answerData]) => {
                                    flattenedSubmitted[questionId] = answerData;
                                });
                            }
                        });
                    }
                });
            }

            if (isMounted) {
              setAnswers(normalizeAnswers(flattenedSubmitted)); // Normalize after flattening
            }

            return; // ✅ Don't load draft if it's already submitted
          }
        } catch (submissionErr) {
          console.warn("No submission status found or error fetching submission status.", submissionErr);
          // Don't set error here, as it might just mean no submission exists yet.
        }

        // 📝 Only fetch draft if not submitted or if submission check failed gracefully
        try {
          const draftRes = await axios.get(`${BASE_URL}gfgp/assessment-responses/${userId}/${structure}`);
          if (isMounted) {
            if (draftRes.data) {
              console.log("Draft response found:", draftRes.data);
              const rawAnswers = draftRes.data.answers || {};
              // Draft answers should already be flat (questionId: {answer, justification, evidence})
              const parsedAnswers = typeof rawAnswers === "string" ? JSON.parse(rawAnswers) : rawAnswers;
              setAnswers(normalizeAnswers(parsedAnswers));
            } else {
              console.warn("Draft response is null — starting fresh.");
              setAnswers({});
            }
          }
        } catch (draftErr) {
          console.warn("No draft found — starting fresh.", draftErr);
          if (isMounted) setAnswers({});
        }

      } catch (err) {
        console.error(err);
        if (isMounted) setError("Failed to load questionnaire template.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTemplateAndDraft();

    return () => {
      isMounted = false;
    };
  }, [userId, structure, BASE_URL]); // Added BASE_URL to dependency array for clarity

  useEffect(() => {
    if (!template || !hasInteracted || isLocked) return;
    const debounceSave = setTimeout(() => { // Renamed debounce to debounceSave
      saveDraft();
    }, 60000); // 1 minute

    return () => clearTimeout(debounceSave); // Cleared debounceSave
  }, [answers, template, hasInteracted, isLocked]); // Added template, hasInteracted, isLocked to dependencies

  const saveDraft = async () => {
    setSaving(true);
    try {
      await axios.post(`${BASE_URL}gfgp/assessment-responses/save`, {
        userId,
        // Use templateCode instead of structure if structure is just a generic ID
        templateCode: template.templateCode,
        version: template.version,
        answers, // Answers are stored flat in draft
      });
      setLastSaved(new Date());
    } catch (err) {
      console.error("Failed to save draft", err);
    } finally {
      setSaving(false);
    }
  };

  const shouldShowQuestion = question => {
    if (!question.conditional) return true;
    const { questionId, showIf } = question.conditional;
    // Ensure answers[questionId] exists before accessing .answer
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
      alert("File upload failed. Try again.");
    }
  };

  const handleSubmit = async e => {
    e?.preventDefault();
    if (!hasInteracted && !isLocked) { // Prevent submission if no interaction and not already locked/submitted
      toast.warn("Please interact with the form before submitting.");
      return;
    }

    try {
      // Structure answers based on the template's actual structure
      const structuredAnswers = structureAnswers(answers, template);
      await axios.post(`${BASE_URL}gfgp/assessment-responses/submit`, {
        userId,
        structure,
        version: template.version,
        answers: structuredAnswers,
      });

      setSubmitted(true);
      toast.success("Assessment submitted successfully!");

      // Re-fetch submission status to confirm lock
      const freshRes = await axios.get(`${BASE_URL}gfgp/assessment-submissions/${userId}/${structure}`);
      console.log("Submitted status found:", freshRes.data.status);
      if (freshRes.data.status?.toUpperCase() === "SUBMITTED") setIsLocked(true);
    } catch (err) {
      console.error("Submission error:", err);
      setError(`Failed to submit your responses: ${err.response?.data?.message || err.message}`);
      toast.error(`Failed to submit: ${err.response?.data?.message || err.message}`);
    }
  };

  /**
   * Restructures the flat answers object into a nested, hierarchical object
   * matching the template's sections, subsections, and questions using their IDs.
   * This is crucial for the backend to correctly apply scoring criteria.
   * @param {object} flatAnswers A flat object of answers, keyed by question.id.
   * @param {object} template The full questionnaire template object.
   * @returns {object} A nested object of answers.
   */
  const structureAnswers = (flatAnswers, template) => {
    const structured = {};

    template.sections.forEach(section => {
      // Use section.sectionId as the top-level key for the section's answers
      structured[section.sectionId] = {
        sectionTitle: section.title, // Include title for context if backend needs it
        subsections: {}
      };

      (section.subsections || []).forEach(subsection => {
        // Use subsection.subsectionId as the key for the subsection's answers
        structured[section.sectionId].subsections[subsection.subsectionId] = {
          subsectionTitle: subsection.title, // Include title for context
          questions: {}
        };

        (subsection.questions || []).forEach(question => {
          const questionId = question.id; // Use question.id as the key for the question's answer
          if (flatAnswers[questionId]) {
            // Store the answer object (answer, justification, evidence) as it is in flatAnswers
            structured[section.sectionId].subsections[subsection.subsectionId].questions[questionId] = flatAnswers[questionId];
          }
        });

        // Clean up empty subsections if no questions have answers
        if (Object.keys(structured[section.sectionId].subsections[subsection.subsectionId].questions).length === 0) {
          delete structured[section.sectionId].subsections[subsection.subsectionId];
        }
      });

      // Clean up empty sections if no subsections have answers
      if (Object.keys(structured[section.sectionId].subsections).length === 0) {
        delete structured[section.sectionId];
      }
    });

    return structured;
  };


  const renderInput = (question) => {
    const disabled = isLocked;
    const response = answers[question.id] || {}; // Get the answer object for this question

    const handleAnswerChange = (value) => {
      setHasInteracted(true);
      setAnswers((prev) => {
        const newState = {
          ...prev,
          [question.id]: {
            ...prev[question.id], // Preserve existing justification/evidence if any
            answer: value,
          },
        };
        // Clear justification if answer is not 'Not Applicable' and current answer was 'Not Applicable'
        if (value !== "Not Applicable" && prev[question.id]?.answer === "Not Applicable") {
            delete newState[question.id].justification;
        }
        // Clear evidence if answer is not 'Yes' and current answer was 'Yes'
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
            id={`question-${question.id}-${opt}`} // Unique ID for accessibility
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
                        // Optionally reset input value after upload to allow selecting same file again
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

  if (loading || !template) {
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

  // Handle case where allVisibleQuestions.length is 0 to prevent NaN
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
      <div className="row mb-3">
        <div className="col-md-6">
          <button
            onClick={saveDraft}
            disabled={saving || isLocked}
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

      {isLocked && (
        <Alert variant="info" className="text-center">
          🔒 This assessment has been submitted and is under review. You can no longer make changes.
        </Alert>
      )}
      {submitted && <Alert variant="success" className="text-center">🎉 Assessment submitted successfully!</Alert>}


      <Form onSubmit={handleSubmit}>
        {template.sections.map(section => (
          <Card key={section.sectionId} className="mb-4 shadow-sm">
            <Card.Body>
              <h5 className="text-primary">{section.title}</h5>
              <p className="text-muted">{section.description}</p>

              {section.subsections?.map(subsection => (
                <div key={subsection.subsectionId} className="mb-3 ps-3 border-start">
                  <h6 className="text-secondary">{subsection.title}</h6>
                  {subsection.questions?.map(q => (
                    shouldShowQuestion(q) && (
                      <Form.Group key={q.id} className="mb-4">
                        <Form.Label className="fw-semibold fs-6">
                          {q.questionText} {q.required && <span className="text-danger">*</span>}
                        </Form.Label>
                        {renderInput(q)}
                        {q.guidance && <Form.Text className="text-muted d-block mt-2">{q.guidance}</Form.Text>}
                      </Form.Group>
                    )
                  ))}
                </div>
              ))}
            </Card.Body>
          </Card>
        ))}

        <div className="text-end d-grid gap-2">
          <Button type="submit" variant="success" size="lg" disabled={saving || isLocked}>
            {saving ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default DynamicQuestionnaireForm;