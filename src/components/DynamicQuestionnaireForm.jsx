import React, { useEffect, useState } from "react";
import axios from "axios";
import { Spinner, Container, ProgressBar, Card, Form, Button, Alert } from "react-bootstrap";

const DynamicQuestionnaireForm = () => {
  const [template, setTemplate] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.userId;
  const structure = localStorage.getItem("gfgpStructure");
  const FIXED_OPTIONS = ["Yes", "In-progress", "No", "Not Applicable"];

  useEffect(() => {
    let isMounted = true;

    if (!userId || !structure) return;

    const fetchTemplateAndDraft = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${BASE_URL}gfgp/questionnaire-templates/structure/${structure}`);
        const [templateObj] = res.data;

        if (!templateObj || !templateObj.content) throw new Error("Template content missing.");
        const parsedContent = typeof templateObj.content === "string"
          ? JSON.parse(templateObj.content)
          : templateObj.content;

        if (isMounted) {
          setTemplate({
            ...parsedContent,
            title: templateObj.title,
            version: templateObj.version,
          });
        }

        try {
          const draftRes = await axios.get(`${BASE_URL}gfgp/assessment-responses/${userId}/${structure}`);
          if (isMounted) {
            if (draftRes.data) {
              setAnswers(draftRes.data.answers || {});
            } else {
              console.warn("Draft response is null — starting fresh.");
              setAnswers({});
            }
          }
        } catch (draftErr) {
          console.warn("No draft found — starting fresh.", draftErr);
          if (isMounted) setAnswers({});
        }
        // >> Check if already submitted
        try {
          const submissionStatusRes = await axios.get(`${BASE_URL}gfgp/assessment-submissions/${userId}/${structure}`);
          if (submissionStatusRes.data?.status?.toUpperCase() === "SUBMITTED") {
            if (isMounted) setIsLocked(true);
          }
        } catch (submissionErr) {
          console.warn("No submission status found — may be unsubmitted.", submissionErr);
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
  }, [userId, structure]);


  useEffect(() => {
    if (!template || !hasInteracted) return;

    const saveDraft = async () => {
      setSaving(true);
      try {
        await axios.post(`${BASE_URL}gfgp/assessment-responses/save`, {
          userId,
          structure,
          version: template.version,
          answers,
        });
      } catch (err) {
        console.error("Failed to save draft", err);
      } finally {
        setSaving(false);
      }
    };

    const debounce = setTimeout(saveDraft, 60000);  // 1 minute debounce
    return () => clearTimeout(debounce);
  }, [answers]);

  const shouldShowQuestion = question => {
    if (!question.conditional) return true;
    const { questionId, showIf } = question.conditional;
    return showIf.includes(answers[questionId]);
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
    if (!hasInteracted) return;

    try {
      await axios.post(`${BASE_URL}gfgp/assessment-responses/submit`, { //full-submission
        userId,
        structure,
        version: template.version,
        answers,
      });
      setSubmitted(true);
      const freshRes = await axios.get(`${BASE_URL}gfgp/assessment-submissions/${userId}/${structure}`);
      console.log("Submitted status found:", freshRes.data.status);
      if (freshRes.data.status?.toUpperCase() === "SUBMITTED") setIsLocked(true);
    } catch (err) {
      console.error("Submission error:", err);
      setError("Failed to submit your responses.");
    }
  };

  const renderInput = (question) => {
    const disabled = isLocked;
    const response = answers[question.id] || {};

    const handleAnswerChange = (value) => {
      setHasInteracted(true);
      setAnswers((prev) => ({
        ...prev,
        [question.id]: {
          ...prev[question.id],
          answer: value,
          ...(value !== "Not Applicable" ? { justification: "" } : {})
        },
      }));
    };

    return (
      <>
        {FIXED_OPTIONS.map((opt) => (
          <Form.Check
            key={opt}
            type="radio"
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
        )}
        {response.evidence && (
          <div className="mt-2">
            <a href={response.evidence} target="_blank" rel="noreferrer">
              View uploaded evidence
            </a>
          </div>
        )}
      </>
    );
  };

  if (!userId || !structure) {
    return (
      <Container className="mt-5 text-center">
        <Alert variant="danger">Missing user or structure. Please log in properly.</Alert>
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

  if (!template) {
    return (
      <Container className="mt-5 text-center">
        <Alert variant="warning">No questionnaire available.</Alert>
      </Container>
    );
  }

  // Progress bar calculation
  const allVisibleQuestions = template.sections
    .flatMap(section => section.questions)
    .filter(shouldShowQuestion);

  const answeredCount = allVisibleQuestions.filter(q => {
    const val = answers[q.id];
    if (q.type === "CHECKBOX") return Array.isArray(val) && val.length > 0;
    return val !== undefined && val !== "";
  }).length;

  const progress = Math.round((answeredCount / allVisibleQuestions.length) * 100);


  return (
    <Container className="py-4">
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <h2 className="mb-0">{template.title}</h2>
          <small className="text-muted">Version: {template.version}</small>
        </Card.Body>
        <ProgressBar now={progress} label={`${progress}% completed`} />
      </Card>

      {isLocked && (
        <Alert variant="info" className="text-center">
          🔒 This assessment has been submitted and is under review. You can no longer make changes.
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        {template.sections.map(section => (
          <Card key={section.sectionId} className="mb-4 shadow-sm">
            <Card.Body>
              <h5 className="text-primary">{section.title}</h5>
              <p className="text-muted">{section.description}</p>

              {section.questions.map(q => (
                shouldShowQuestion(q) && (
                  <Form.Group key={q.id} className="mb-4">
                    <Form.Label className="fw-semibold fs-6">
                      {q.questionText} {q.required && <span className="text-danger">*</span>}
                    </Form.Label>
                    {renderInput(q)}
                    {q.guidance && <Form.Text className="text-muted">{q.guidance}</Form.Text>}
                  </Form.Group>
                )
              ))}
            </Card.Body>
          </Card>
        ))}

        {saving && <p className="text-info">💾 Saving your draft...</p>}
        {submitted && <Alert variant="success">🎉 Assesement submitted successfully!</Alert>}

        <div className="text-end d-grid gap-2">
          <Button type="submit" variant="success" size="lg" disabled={saving || isLocked}>
            {saving ? "Saving..." : "Submit"}
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default DynamicQuestionnaireForm;
