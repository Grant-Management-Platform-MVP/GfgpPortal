import React, { useEffect, useState } from "react";
import axios from "axios";
import {Spinner, Container, ProgressBar, Card, Form, Button, Alert } from "react-bootstrap";

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

  const handleChange = (questionId, value) => {
    setHasInteracted(true);
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const shouldShowQuestion = question => {
    if (!question.conditional) return true;
    const { questionId, showIf } = question.conditional;
    return showIf.includes(answers[questionId]);
  };

  const handleSubmit = async e => {
    e?.preventDefault();
    if (!hasInteracted) return;

    try {
      await axios.post(`${BASE_URL}gfgp/assessment-responses/submit`, {
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

  const renderInput = question => {
    const disabled = isLocked;

    switch (question.type) {
      case "TEXT":
        return (
          <Form.Control
            type="text"
            maxLength={question.typeConfig?.maxLength || 255}
            value={answers[question.id] || ""}
            onChange={e => handleChange(question.id, e.target.value)}
            disabled={disabled}
          />
        );
      case "TEXTAREA":
        return (
          <Form.Control
            as="textarea"
            rows={3}
            value={answers[question.id] || ""}
            onChange={e => handleChange(question.id, e.target.value)}
            disabled={disabled}
          />
        );
      case "NUMBER":
        return (
          <Form.Control
            type="number"
            value={answers[question.id] || ""}
            onChange={e => handleChange(question.id, e.target.value)}
            disabled={disabled}
          />
        );
      case "SINGLE_CHOICE":
      case "RADIO":
        return question.options.map((opt, idx) => (
          <Form.Check
            key={idx}
            type="radio"
            name={question.id}
            label={opt}
            value={opt}
            checked={answers[question.id] === opt}
            onChange={e => handleChange(question.id, e.target.value)}
            disabled={disabled}
          />
        ));
      case "CHECKBOX":
        return question.options.map((opt, idx) => (
          <Form.Check
            key={idx}
            type="checkbox"
            label={opt}
            checked={answers[question.id]?.includes(opt) || false}
            onChange={e => {
              const current = answers[question.id] || [];
              const updated = e.target.checked
                ? [...current, opt]
                : current.filter(v => v !== opt);
              handleChange(question.id, updated);
            }}
            disabled={disabled}
          />
        ));
      case "FILE_UPLOAD":
        return (
          <Form.Control
            type="file"
            onChange={e => {
              const file = e.target.files[0];
              if (file) {
                console.warn("File upload stubbed — storing file name only.");
                handleChange(question.id, file.name);
              }
            }}
            disabled={disabled}
          />
        );
      default:
        return <p className="text-danger">Unsupported type: {question.type}</p>;
    }
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
