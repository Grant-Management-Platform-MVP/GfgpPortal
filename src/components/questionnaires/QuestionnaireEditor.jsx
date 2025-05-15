import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Spinner,
  Alert,
  Accordion,
  Card,
  Button,
  Form,
  Modal,
  Container,
} from "react-bootstrap";

const QuestionnaireEditor = () => {
  const { id } = useParams();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ sectionIndex: null, questionIndex: null });

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await fetch(`${BASE_URL}gfgp/questionnaire-templates/id/${id}`);
        if (!response.ok) throw new Error("Failed to fetch template");
        const data = await response.json();
        const templateObj = data[0];
        setTemplate({ ...templateObj, content: JSON.parse(templateObj.content) });
      } catch (err) {
        console.error(err);
        setError("Failed to load questionnaire template.");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [id]);

  const handleSave = async () => {
    try {
      const response = await fetch(`${BASE_URL}gfgp/questionnaire-templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...template,
          content: JSON.stringify(template.content),
        }),
      });

      if (!response.ok) throw new Error("Save failed");
      alert("Template saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Error saving template");
    }
  };

  const addNewSection = () => {
    const newSection = { title: "New Section", description: "", questions: [] };
    setTemplate((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        sections: [...prev.content.sections, newSection],
      },
    }));
  };

  const addQuestion = (secIndex) => {
    const newQuestion = {
      questionText: "",
      guidance: "",
      type: "TEXT",
      options: [],
    };
    const updatedSections = [...template.content.sections];
    updatedSections[secIndex].questions.push(newQuestion);
    setTemplate({ ...template, content: { ...template.content, sections: updatedSections } });
  };

  const confirmDelete = (sectionIndex, questionIndex = null) => {
    setDeleteTarget({ sectionIndex, questionIndex });
    setShowConfirm(true);
  };

  const handleDelete = () => {
    const { sectionIndex, questionIndex } = deleteTarget;
    const updatedSections = [...template.content.sections];

    if (questionIndex === null) {
      // Delete whole section
      updatedSections.splice(sectionIndex, 1);
    } else {
      // Delete specific question
      updatedSections[sectionIndex].questions.splice(questionIndex, 1);
    }

    setTemplate({ ...template, content: { ...template.content, sections: updatedSections } });
    setShowConfirm(false);
  };
   if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
        <p className="lead">Loading questionnaire editor...</p>
      </Container>
    );
  }
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div className="p-4">
      <h4 className="text-2xl font-bold mb-4 text-primary">Editing: {template.title}</h4>

      <Form.Group className="mb-3">
        <Form.Label>Title</Form.Label>
        <Form.Control
          value={template.title}
          onChange={(e) =>
            setTemplate((prev) => ({ ...prev, title: e.target.value }))
          }
        />
      </Form.Group>

      <Button variant="primary" onClick={addNewSection} className="mb-4 btn-lg">
        ➕ Add New Section
      </Button>

      <Accordion defaultActiveKey="0">
        {template.content.sections.map((section, secIndex) => (
          <Accordion.Item eventKey={String(secIndex)} key={secIndex}>
            <Accordion.Header>
              Section {secIndex + 1}: {section.title}
            </Accordion.Header>
            <Accordion.Body>
              <Form.Group className="mb-3">
                <Form.Label>Section Title</Form.Label>
                <Form.Control
                  value={section.title}
                  onChange={(e) => {
                    const updatedSections = [...template.content.sections];
                    updatedSections[secIndex].title = e.target.value;
                    setTemplate({ ...template, content: { ...template.content, sections: updatedSections } });
                  }}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  value={section.description}
                  onChange={(e) => {
                    const updatedSections = [...template.content.sections];
                    updatedSections[secIndex].description = e.target.value;
                    setTemplate({ ...template, content: { ...template.content, sections: updatedSections } });
                  }}
                />
              </Form.Group>

              <div className="d-flex justify-content-between mb-2">
                <h5>Questions</h5>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => confirmDelete(secIndex)}
                >
                  🗑️ Delete Section
                </Button>
              </div>

              {section.questions.map((question, qIndex) => (
                <Card className="mb-3" key={qIndex}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <strong>Question {qIndex + 1}</strong>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => confirmDelete(secIndex, qIndex)}
                      >
                        Delete
                      </Button>
                    </div>

                    <Form.Group className="mb-2 mt-2">
                      <Form.Label>Question Text</Form.Label>
                      <Form.Control
                        value={question.questionText}
                        onChange={(e) => {
                          const updatedSections = [...template.content.sections];
                          updatedSections[secIndex].questions[qIndex].questionText = e.target.value;
                          setTemplate({ ...template, content: { ...template.content, sections: updatedSections } });
                        }}
                      />
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Label>Guidance</Form.Label>
                      <Form.Control
                        value={question.guidance || ""}
                        onChange={(e) => {
                          const updatedSections = [...template.content.sections];
                          updatedSections[secIndex].questions[qIndex].guidance = e.target.value;
                          setTemplate({ ...template, content: { ...template.content, sections: updatedSections } });
                        }}
                      />
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Label>Type</Form.Label>
                      <Form.Select
                        value={question.type}
                        onChange={(e) => {
                          const updatedSections = [...template.content.sections];
                          updatedSections[secIndex].questions[qIndex].type = e.target.value;
                          setTemplate({ ...template, content: { ...template.content, sections: updatedSections } });
                        }}
                      >
                        <option value="TEXT">Text</option>
                        <option value="SINGLE_CHOICE">Single Choice</option>
                        <option value="MULTI_CHOICE">Multi Choice</option>
                      </Form.Select>
                    </Form.Group>

                    {(question.type === "SINGLE_CHOICE" || question.type === "MULTI_CHOICE") && (
                      <Form.Group>
                        <Form.Label>Options (comma-separated)</Form.Label>
                        <Form.Control
                          value={question.options?.join(", ") || ""}
                          onChange={(e) => {
                            const updatedSections = [...template.content.sections];
                            updatedSections[secIndex].questions[qIndex].options = e.target.value.split(",").map((opt) => opt.trim());
                            setTemplate({ ...template, content: { ...template.content, sections: updatedSections } });
                          }}
                        />
                      </Form.Group>
                    )}
                  </Card.Body>
                </Card>
              ))}

              <Button variant="outline-success" size="sm" onClick={() => addQuestion(secIndex)}>
                ➕ Add Question
              </Button>
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>

      <Button className="mt-4 btn-success btn-lg" onClick={handleSave}>
        💾 Save Changes
      </Button>

      {/* Confirmation Modal */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Are you sure?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          This action cannot be undone. Do you really want to delete this{" "}
          {deleteTarget.questionIndex === null ? "section" : "question"}?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Yes, Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default QuestionnaireEditor;