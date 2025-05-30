import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const getLineChartData = (template, grantees, granteeAnswers) => {
  // Ensure template.sections exist before iterating
  if (!template?.sections) {
    return grantees.map((g) => ({
      name: g.granteeName || `Grantee #${g.userId}`,
      compliance: 0
    }));
  }

  return grantees.map((g) => {
    let met = 0;
    let totalApplicableQuestions = 0; // Renamed 'total' for clarity: only applicable questions

    template.sections.forEach((section) => {
      // CORRECTED: Flatten questions from all subsections within this section
      const allQuestionsInSection = (section.subsections || []).flatMap(
        (subsection) => subsection.questions || []
      );

      allQuestionsInSection.forEach((q) => {
        const answer = granteeAnswers[g.id]?.[q.id]?.answer;
        if (answer === 'Yes') {
          met += 1;
        }
        // Count only questions that are not 'Not Applicable' towards total applicable questions
        if (answer && answer !== 'Not Applicable') {
          totalApplicableQuestions += 1;
        }
      });
    });

    return {
      name: g.granteeName || `Grantee #${g.userId}`,
      compliance: totalApplicableQuestions > 0 ? (met / totalApplicableQuestions) * 100 : 0
    };
  });
};

const ComparisonLineChart = ({ grantees, granteeAnswers, template }) => {
  // Add a check for template.sections and grantees to prevent errors if data isn't ready
  if (!template?.sections || grantees.length === 0) {
    return null;
  }

  const chartData = getLineChartData(template, grantees, granteeAnswers);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <XAxis dataKey="name" />
        <YAxis domain={[0, 100]} label={{ value: 'Compliance (%)', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="compliance" stroke="#0d6efd" activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ComparisonLineChart;