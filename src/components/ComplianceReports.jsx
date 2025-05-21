import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Spinner,
  Card,
  Table,
  Alert,
  OverlayTrigger,
  Tooltip,
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

const STATUS_MAP = {
  Yes: { label: "Met", variant: "success", points: 2 },
  "In-progress": { label: "Partially Met", variant: "warning", points: 1 },
  No: { label: "Not Met", variant: "danger", points: 0 },
  "Not Applicable": { label: "N/A", variant: "secondary", points: 0 },
};

const ComplianceReports = () => {
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState(null);
  const [responses, setResponses] = useState({});
  const [error, setError] = useState("");
  const [completeness, setCompleteness] = useState(null);
  const [compliance, setCompliance] = useState(null);

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  const structure = localStorage.getItem("gfgpStructure");

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.userId || !structure) return;

      try {
        const [templateRes, responseRes] = await Promise.all([
          axios.get(`${BASE_URL}gfgp/questionnaire-templates/structure/${structure}`),
          axios.get(`${BASE_URL}gfgp/assessment-submissions/${user.userId}/${structure}`),
        ]);

        const [templateObj] = templateRes.data;
        const parsedTemplate =
          typeof templateObj.content === "string"
            ? JSON.parse(templateObj.content)
            : templateObj.content;

        let parsedAnswers = {};
        try {
          const raw = responseRes.data.answers;
          parsedAnswers = typeof raw === "string" ? JSON.parse(raw) : raw || {};
        } catch (e) {
          console.error("Failed to parse answers", e);
          setError("Error parsing assessment answers.");
          return;
        }

        setTemplate(parsedTemplate);
        setResponses(parsedAnswers);
        setCompleteness(responseRes.data.completeness || null);
        setCompliance(responseRes.data.compliance || null);
      } catch (err) {
        console.error(err);
        setError("Failed to load compliance report.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getSectionScores = (section) => {
    const applicableQuestions = section.questions.filter(
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

    return template.sections.map((section) => {
      let counts = { Met: 0, "Partially Met": 0, "Not Met": 0, "N/A": 0 };

      section.questions.forEach((q) => {
        const answer = responses[q.id]?.answer;
        const status = STATUS_MAP[answer]?.label || "N/A";
        if (status in counts) counts[status]++;
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
      <p>
        <strong>Structure:</strong> {structure}
      </p>

      {completeness !== null && compliance !== null && (
        <Alert variant="info">
          <strong>Completeness:</strong> {completeness.toFixed(1)}% | {" "}
          <strong>Compliance:</strong> {compliance.toFixed(1)}%
        </Alert>
      )}

      {/* SECTION TABLES */}
      {template.sections.map((section, index) => {
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

              <Table bordered hover>
                <thead className="table-light">
                  <tr>
                    <th>Question</th>
                    <th>Status</th>
                    <th>Evidence</th>
                    <th>Justification (if N/A)</th>
                  </tr>
                </thead>
                <tbody>
                  {section.questions.map((q) => {
                    const response = responses[q.id] || {};
                    const answer = response.answer;
                    const status = STATUS_MAP[answer] || {
                      label: "No Response",
                      variant: "light",
                      points: 0,
                    };

                    return (
                      <tr key={q.id}>
                        <td>{q.questionText}</td>
                        <td>
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>{`${status.points} points`}</Tooltip>}
                          >
                            <span className={`badge bg-${status.variant}`}>{status.label}</span>
                          </OverlayTrigger>
                        </td>
                        <td>{response.evidence || "—"}</td>
                        <td>{response.justification || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
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
              <Bar dataKey="Met" stackId="a" fill="#198754" />
              <Bar dataKey="Partially Met" stackId="a" fill="#ffc107" />
              <Bar dataKey="Not Met" stackId="a" fill="#dc3545" />
              <Bar dataKey="N/A" stackId="a" fill="#6c757d" />
            </BarChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ComplianceReports;