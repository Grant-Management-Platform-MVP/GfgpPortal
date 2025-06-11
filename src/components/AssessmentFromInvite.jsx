import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Spinner,
    Container,
    ProgressBar,
    Card,
    Form,
    Button,
    Alert,
} from "react-bootstrap";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AssessmentFromInvite = () => {
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const { inviteId } = useParams();
    const location = useLocation();
    const invite = location.state?.invite || null;
    const [hasInteracted, setHasInteracted] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [template, setTemplate] = useState(null);
    const [lastSaved, setLastSaved] = useState(null);
    const currentInvite = invite;
    const persistedStructure = localStorage.getItem("gfgpStructure");
    const navigate = useNavigate();
    // This state will hold the raw template object from the API, useful if you need other top-level properties
    const BASE_URL = import.meta.env.VITE_BASE_URL;
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.userId;
    const FIXED_OPTIONS = ["Yes", "In-progress", "No", "Not Applicable"];
    const { tieredLevel } = useParams(); // 'tieredLevel' from URL will be 'urlTieredLevel'
    const {structureType} = useParams(); // 'structureType' from URL will be 'urlStructureType
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

    useEffect(() => {
        let isMounted = true;
        console.log(structureType, "structureType from URL");

        if (!invite) {
            if (isMounted) {
                setError(
                    "Missing Invite or GFGP structure. Please ensure you are logged in and have selected an invitation."
                );
                setLoading(false);
            }
            return;
        }
        const fetchInviteAndTemplate = async () => {
            setLoading(true);
            setError("");

            let templateApiUrl;

            // Use the structure derived from the invite (or prop) and the tieredLevel from the URL
            if (currentInvite.structureType === 'tiered' && tieredLevel) {
                // Send tieredLevel as a query parameter as per our backend refactor plan
                templateApiUrl = `${BASE_URL}gfgp/questionnaire-templates/structure/${currentInvite.structureType}/${tieredLevel}`;
            } else {
                // For non-tiered structures (Foundation, Advanced), no tieredLevel needed
                templateApiUrl = `${BASE_URL}gfgp/questionnaire-templates/structure/${currentInvite.structureType}`;
            }

            try {
                const templateRes = await axios.get(templateApiUrl);
                const [templateObj] = templateRes.data;
                if (!templateObj || !templateObj.content)
                    throw new Error("Template content missing.");
                const parsedContent =
                    typeof templateObj.content === "string"
                        ? JSON.parse(templateObj.content)
                        : templateObj.content;

                if (isMounted) {
                    setTemplate({
                        ...parsedContent,
                        title: templateObj.title,
                        version: templateObj.version,
                        templateCode: templateObj.templateCode,
                    });
                }

                // >> Check if already submitted
                try {
                    const submissionStatusRes = await axios.get(
                        `${BASE_URL}gfgp/assessment-submissions/${userId}/${persistedStructure}`
                    );
                    if (submissionStatusRes.data?.status?.toUpperCase() === "SUBMITTED") {
                        if (isMounted) setIsLocked(true);
                    }
                } catch (submissionErr) {
                    console.warn(
                        "No submission status found — may be unsubmitted.",
                        submissionErr
                    );
                }
            } catch (err) {
                console.error(
                    "Failed to load questionnaire template or initial data:",
                    err
                );
                if (isMounted)
                    setError("Failed to load questionnaire template or initial data.");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchInviteAndTemplate();
        return () => {
            isMounted = false;
        };
    }, [inviteId, invite, BASE_URL]);

    useEffect(() => {
        if (!template || !hasInteracted) return;
        const debounceSave = setTimeout(() => {
            saveDraft();
        }, 60000); // 1 minute

        return () => clearTimeout(debounceSave);
    }, [answers, template, hasInteracted]);

    const saveDraft = async () => {
        setSaving(true);
        try {
            await axios.post(`${BASE_URL}gfgp/assessment-responses/save`, {
                userId,
                structure: currentInvite.structureType,
                tieredLevel: currentInvite.structureType === 'tiered' ? tieredLevel : null,
                templateCode: template.templateCode,
                version: template.version,
                answers: Object.fromEntries(
                    Object.entries(answers).map(([qid, ansObj]) => {
                        const { funderFeedback: _, ...rest } = ansObj;
                        return [qid, rest];
                    })
                ),
            });
            // 2. Make API call to update invite status to active=false
            // Ensure inviteId is available from useParams()
            if (inviteId) {
                await axios.put(`${BASE_URL}gfgp/invites/${inviteId}/status`);
            } else {
                console.warn("Invite ID missing, cannot deactivate invitation.");
            }
            setLastSaved(new Date());
            toast.success("Draft saved!");
            navigate('/grantee/assessments');
        } catch (err) {
            console.error("Failed to save draft", err);
            toast.error("Failed to save draft.");
        } finally {
            setSaving(false);
        }
    };

    const shouldShowQuestion = (question) => {
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
                headers: { "Content-Type": "multipart/form-data" },
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

        // if (!hasInteracted) {
        //     toast.warn("Please interact with the form before submitting.");
        //     return;
        // }

        try {
            const answersForSubmission = Object.fromEntries(
                Object.entries(answers).map(([qid, ansObj]) => {
                    const { funderFeedback: _, ...rest } = ansObj;
                    return [qid, rest];
                })
            );

            const structuredAnswers = structureAnswers(
                answersForSubmission,
                template
            );

            const submissionPayload = {
                userId,
                structure: structureType,
                tieredLevel: structureType === 'tiered' ? tieredLevel : null, // Send null for non-tiered
                version: template.version,
                answers: structuredAnswers,
            };

            await axios.post(
                `${BASE_URL}gfgp/assessment-responses/submit`,
                submissionPayload
            );
            toast.success("Assessment submitted successfully!");
            // if (inviteId) {
            //     await axios.put(`${BASE_URL}gfgp/invites/${inviteId}/status`);
            // } else {
            //     console.warn("Invite ID missing, cannot deactivate invitation.");
            // }
            setSubmitted(true);
            navigate('/grantee/')
            const freshRes = await axios.get(
                `${BASE_URL}gfgp/assessment-submissions/${userId}/${template.structure}`
            );
            console.log("Submitted status found:", freshRes.data.status);
            if (freshRes.data.status?.toUpperCase() === "SUBMITTED")
                setIsLocked(true);
        } catch (err) {
            console.error("Submission error:", err);
            const message = err.response?.data?.message || err.message;
            setError(`Failed to submit your responses: ${message}`);
            toast.error(`Failed to submit: ${message}`);
        }
    };

    const structureAnswers = (flatAnswers, template) => {
        const structured = {};
        template.sections.forEach((section) => {
            structured[section.sectionId] = {
                sectionTitle: section.title,
                subsections: {},
            };
            (section.subsections || []).forEach((subsection) => {
                structured[section.sectionId].subsections[subsection.subsectionId] = {
                    subsectionTitle: subsection.title,
                    questions: {},
                };
                (subsection.questions || []).forEach((question) => {
                    const questionId = question.id;
                    if (flatAnswers[questionId]) {
                        structured[section.sectionId].subsections[
                            subsection.subsectionId
                        ].questions[questionId] = flatAnswers[questionId];
                    }
                });
                if (
                    Object.keys(
                        structured[section.sectionId].subsections[subsection.subsectionId]
                            .questions
                    ).length === 0
                ) {
                    delete structured[section.sectionId].subsections[
                        subsection.subsectionId
                    ];
                }
            });
            if (Object.keys(structured[section.sectionId].subsections).length === 0) {
                delete structured[section.sectionId];
            }
        });
        return structured;
    };

    const renderInput = (question) => {
        const disabled = isLocked;
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
                if (
                    value !== "Not Applicable" &&
                    prev[question.id]?.answer === "Not Applicable"
                ) {
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
            </>
        );
    };

    if (!userId) {
        return (
            <Container className="mt-5 text-center">
                <Alert variant="danger">
                    Missing user or structure. Please log in properly or ensure a
                    questionnaire is selected.
                </Alert>
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
        .flatMap((section) => section.subsections || [])
        .flatMap((subsection) => subsection.questions || [])
        .filter((question) => shouldShowQuestion(question));

    const answeredCount = allVisibleQuestions.filter(
        (q) => answers[q.id]?.answer && answers[q.id]?.answer !== ""
    ).length;

    const progress =
        allVisibleQuestions.length > 0
            ? Math.round((answeredCount / allVisibleQuestions.length) * 100)
            : 100;

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
                </Card.Body>
                <ProgressBar now={progress} label={`${progress}% completed`} />
            </Card>

            {isLocked && (
                <Alert variant="info" className="text-center">
                    🔒 This assessment has been submitted and is under review. You can no
                    longer make changes.
                </Alert>
            )}

            <div className="row mb-3">
                <div className="col-md-6">
                    <button
                        onClick={saveDraft}
                        disabled={saving}
                        className="btn btn-warning btn-lg mb-4"
                    >
                        {saving ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                />
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
                            Draft saved at{" "}
                            {lastSaved.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </small>
                    )}
                </div>
            </div>

            <Form onSubmit={handleSubmit}>
                <fieldset>

                    <Card key={currentSection.sectionId} className="mb-4 shadow-sm">
                        <Card.Body>
                            <h5 className="text-primary">{currentSection.title}</h5>
                            {currentSection.description && (
                                <p
                                    className="text-muted"
                                    dangerouslySetInnerHTML={{ __html: currentSection.description }}
                                />
                            )}
                            {currentSection.subsections?.map((subsection) => (
                                <div
                                    key={subsection.subsectionId}
                                    className="mb-3 ps-3 border-start"
                                >
                                    <h6 className="text-secondary">{subsection.title}</h6>
                                    {subsection.description && (
                                        <p
                                            className="text-muted"
                                            dangerouslySetInnerHTML={{
                                                __html: subsection.description,
                                            }}
                                        />
                                    )}
                                    {subsection.questions?.map(
                                        (q) =>
                                            shouldShowQuestion(q) && (
                                                <Form.Group key={q.id} className="mb-4">
                                                    <Form.Label className="fw-semibold fs-6 d-inline-flex align-items-center gap-1">
                                                        <span
                                                            dangerouslySetInnerHTML={{
                                                                __html: q.questionText,
                                                            }}
                                                        />
                                                        {q.required && (
                                                            <span className="text-danger">*</span>
                                                        )}
                                                    </Form.Label>
                                                    {q.guidance && (
                                                        <div
                                                            className="text-muted small mt-2"
                                                            dangerouslySetInnerHTML={{ __html: q.guidance }}
                                                        />
                                                    )}
                                                    {renderInput(q)}
                                                </Form.Group>
                                            )
                                    )}
                                </div>
                            ))}
                        </Card.Body>
                    </Card>

                </fieldset>

                {saving && <p className="text-info">💾 Saving your draft...</p>}
                {submitted && (
                    <Alert variant="success">🎉 Assesement submitted successfully!</Alert>
                )}

                <div className="d-flex justify-content-between align-items-center mt-4">
                    <Button
                        variant="secondary"
                        size="lg"
                        onClick={handlePreviousSection}
                        disabled={isFirstSection}
                    >
                        Previous
                    </Button>

                    {!isLastSection && (
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleNextSection}
                        >
                            Next
                        </Button>
                    )}

                    {isLastSection && (<Button
                        type="submit"
                        variant="success"
                        size="lg"
                        disabled={saving || isLocked}
                    >
                        {saving ? "Saving..." : "Submit"}
                    </Button>
                    )}
                </div>
            </Form>
        </Container>
    );
};
export default AssessmentFromInvite;