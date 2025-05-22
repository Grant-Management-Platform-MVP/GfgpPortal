import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const getLineChartData = (template, grantees, granteeAnswers) => {
  return grantees.map((g) => {
    let met = 0;
    let total = 0;

    template.sections.forEach((section) => {
      section.questions.forEach((q) => {
        const a = granteeAnswers[g.id]?.[q.id]?.answer;
        if (a === 'Yes') met += 1;
        if (a && a !== 'Not Applicable') total += 1;
      });
    });

    return {
      name: g.granteeName || `Grantee #${g.userId}`,
      compliance: total > 0 ? (met / total) * 100 : 0
    };
  });
};

const ComparisonLineChart = ({ grantees, granteeAnswers, template }) => {
  const chartData = getLineChartData(template, grantees, granteeAnswers);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <XAxis dataKey="name" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="compliance" stroke="#0d6efd" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ComparisonLineChart;
