import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const getLineChartData = (grantees, granteeAnswers, selectedGranteesTemplates) => {
  return grantees.map((g) => {
    let met = 0;
    let totalApplicableQuestions = 0;
    const granteeSpecificTemplate = selectedGranteesTemplates[g.id];

    if (!granteeSpecificTemplate?.sections) {
      return {
        name: g.granteeName || `Grantee #${g.userId}`,
        compliance: 0
      };
    }

    granteeSpecificTemplate.sections.forEach((section) => {
      const allQuestionsInSection = (section.subsections || []).flatMap(
        (subsection) => subsection.questions || []
      );

      allQuestionsInSection.forEach((q) => {
        const answer = granteeAnswers[g.id]?.[q.id]?.answer;
        if (answer === 'Yes') {
          met += 1;
        }
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

const ComparisonLineChart = ({ grantees, granteeAnswers, selectedGranteesTemplates }) => {
  if (grantees.length === 0 || Object.keys(selectedGranteesTemplates).length === 0) {
    return null;
  }

  const chartData = getLineChartData(grantees, granteeAnswers, selectedGranteesTemplates);

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