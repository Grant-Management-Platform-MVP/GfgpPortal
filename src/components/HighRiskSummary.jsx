// @components/HighRiskSummary.jsx
import React from 'react';

const HighRiskSummary = ({ template, grantees, granteeAnswers, isHighRisk }) => {
  if (!template || grantees.length === 0) return null;

  return (
    <div className="card mt-4">
      <div className="card-body">
        <h5 className="card-title">High Risk Summary</h5>
        <ul className="list-group">
          {grantees.map((grantee) => {
            const answers = granteeAnswers[grantee.id] || {};
            let highRiskCount = 0;
            const highRiskDetails = [];

            template.sections.forEach((section) => {
              section.questions.forEach((q) => {
                const answer = answers[q.id]?.answer;
                if (isHighRisk(answer)) {
                  highRiskCount++;
                  highRiskDetails.push({
                    section: section.title,
                    question: q.questionText,
                    answer
                  });
                }
              });
            });

            return (
              <li key={grantee.id} className="list-group-item">
                <strong>{grantee.granteeName || `Grantee #${grantee.userId}`}</strong>: {highRiskCount} high-risk areas
                {highRiskCount > 0 && (
                  <ul className="mt-2">
                    {highRiskDetails.map((item, idx) => (
                      <li key={idx}>
                        <strong>{item.section}:</strong> {item.question} — <em>{item.answer}</em>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default HighRiskSummary;