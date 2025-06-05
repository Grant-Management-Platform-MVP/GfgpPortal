import React, { useEffect, useRef, useState } from 'react';
import { Tab, Tabs, Container, Button, Row, Col } from 'react-bootstrap';
import * as d3 from 'd3';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import RiskPerformanceChart from './RiskPerformanceChart';

const ComplianceChart = () => {
    const chartRef = useRef();
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const BASE_URL = import.meta.env.VITE_BASE_URL;

    useEffect(() => {
        fetchComplianceData();
    }, []);

    const getComplianceColor = (value) => {
        if (value >= 80) return '#007bff'; // Blue
        if (value >= 50) return '#17a2b8'; // Teal
        return '#6c757d'; // Grey
    };


    const getCompletenessColor = (value) => {
        if (value >= 80) return '#28a745'; // Green
        if (value >= 50) return '#ffc107'; // Yellow
        return '#dc3545'; // Red
    };

    const fetchComplianceData = async () => {
        try {
            const response = await fetch(`${BASE_URL}gfgp/reports/compliance-progress`);
            const data = await response.json();

            const transformedData = data.map(item => ({
                grantee: item.granteeName || 'Unnamed Grantee',
                completeness: parseFloat(item.completeness.toFixed(2)),
                compliance: parseFloat(item.compliance.toFixed(2))
            }));

            setChartData(transformedData);
            setLoading(false);
            renderChart(transformedData);
        } catch (error) {
            console.error('Failed to fetch compliance data:', error);
            setLoading(false);
        }
    };

    const renderChart = (data) => {
        const svg = d3.select(chartRef.current);
        svg.selectAll("*").remove();

        const margin = { top: 20, right: 30, bottom: 40, left: 180 };
        const width = 800 - margin.left - margin.right;
        const height = data.length * 50;

        svg.attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const y = d3.scaleBand()
            .domain(data.map(d => d.grantee))
            .range([0, height])
            .padding(0.1);

        const x = d3.scaleLinear()
            .domain([0, 100])
            .range([0, width]);

        chart.append("g")
            .call(d3.axisLeft(y));

        chart.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x).ticks(5).tickFormat(d => d + "%"));

        const tooltip = d3.select("#tooltip");

        // Compliance Bars
        chart.selectAll(".bar-compliance")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar-compliance")
            .attr("y", d => y(d.grantee))
            .attr("height", y.bandwidth() / 2)
            .attr("x", 0)
            .attr("fill", d => getComplianceColor(d.compliance))
            .attr("width", 0)
            .on("mouseover", (event, d) => {
                tooltip.style("visibility", "visible")
                    .html(`<strong>${d.grantee}</strong><br/>Compliance: ${d.compliance}%`);
            })
            .on("mousemove", (event) => {
                tooltip.style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", () => {
                tooltip.style("visibility", "hidden");
            })
            .transition()
            .duration(800)
            .attr("width", d => x(d.compliance));

        // Completeness Bars
        chart.selectAll(".bar-completeness")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar-completeness")
            .attr("y", d => y(d.grantee) + y.bandwidth() / 2)
            .attr("height", y.bandwidth() / 2)
            .attr("x", 0)
            .attr("fill", d => getCompletenessColor(d.completeness))
            .attr("width", 0)
            .on("mouseover", (event, d) => {
                tooltip.style("visibility", "visible")
                    .html(`<strong>${d.grantee}</strong><br/>Completeness: ${d.completeness}%`);
            })
            .on("mousemove", (event) => {
                tooltip.style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", () => {
                tooltip.style("visibility", "hidden");
            })
            .transition()
            .duration(800)
            .attr("width", d => x(d.completeness));

        // Labels for Compliance
        chart.selectAll(".label-compliance")
            .data(data)
            .enter()
            .append("text")
            .attr("x", d => x(d.compliance) + 5)
            .attr("y", d => y(d.grantee) + y.bandwidth() / 4 + 4)
            .text(d => `${d.compliance}%`)
            .attr("font-size", "11px")
            .attr("fill", "#333");

        // Labels for Completeness
        chart.selectAll(".label-completeness")
            .data(data)
            .enter()
            .append("text")
            .attr("x", d => x(d.completeness) + 5)
            .attr("y", d => y(d.grantee) + (3 * y.bandwidth()) / 4 + 4)
            .text(d => `${d.completeness}%`)
            .attr("font-size", "11px")
            .attr("fill", "#333");
    };


    const exportPNG = () => {
        html2canvas(document.getElementById("chart-wrapper")).then((canvas) => {
            canvas.toBlob((blob) => saveAs(blob, "compliance-progress.png"));
        });
    };

    const exportPDF = () => {
        const chartElement = document.getElementById("chart-wrapper");

        html2canvas(chartElement).then((canvas) => {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4',
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
            const imgScaledWidth = imgWidth * ratio;
            const imgScaledHeight = imgHeight * ratio;

            const x = (pageWidth - imgScaledWidth) / 2;
            const y = (pageHeight - imgScaledHeight) / 2;

            pdf.addImage(imgData, "PNG", x, y, imgScaledWidth, imgScaledHeight);
            pdf.save("compliance-progress.pdf");
        });
    };


    const exportCSV = () => {
        const csvContent =
            "Grantee,Compliance (%),Completeness (%)\n" +
            chartData.map((d) => `${d.grantee},${d.compliance},${d.completeness}`).join("\n");

        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        saveAs(blob, "compliance-progress.csv");
    };

    return (
        <div>
            <Row className="my-3 justify-content-between align-items-center">
                <Col><h4>Compliance Stats by Grantee</h4></Col>
                <Col className="text-end">
                    <Button variant="primary" className="me-2" onClick={exportPNG} disabled={loading}>Export as PNG</Button>
                    <Button variant="success" className="me-2" onClick={exportPDF} disabled={loading}>Export as PDF</Button>
                    <Button variant="warning" onClick={exportCSV} disabled={loading}>Export as CSV</Button>
                </Col>
            </Row>
            <div id="chart-wrapper">
                <div id="tooltip" style={{
                    position: 'absolute',
                    visibility: 'hidden',
                    backgroundColor: '#fff',
                    border: '1px solid #ccc',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    pointerEvents: 'none',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    zIndex: 10
                }}></div>

                {loading ? (
                    <p>Loading chart...</p>
                ) : (
                    <svg
                        ref={chartRef}
                        width="1200"
                        // height={chartData.length * 50 + 60}
                        height="700"
                        style={{ backgroundColor: '#f8f9fa', borderRadius: 8, border: '1px solid #ccc' }}
                    ></svg>
                )}
            </div>
        </div>
    );
};

const ReportsDashboard = () => {
    const [riskData, setRiskData] = useState([]);
    const [riskSectionNames, setRiskSectionNames] = useState([]);

    useEffect(() => {
        fetchRiskPerformanceData();
    }, []);

    const fetchRiskPerformanceData = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BASE_URL}gfgp/reports/risk-performance`);
            const data = await response.json();

            // Optional: sort or process here if needed
            setRiskData(data);

            // Dynamically extract unique section keys (besides grantee and overall)
            if (data.length > 0) {
                const allKeys = new Set();
                data.forEach(entry => {
                    Object.keys(entry.sections || {}).forEach(k => allKeys.add(k));
                });
                setRiskSectionNames(Array.from(allKeys));
            }
        } catch (error) {
            console.error("Failed to fetch risk performance data:", error);
        }
    };

    class ErrorBoundary extends React.Component {
        constructor(props) {
            super(props);
            this.state = { hasError: false };
        }
        static getDerivedStateFromError(error) {
            return { hasError: true, error };
        }
        componentDidCatch(error, errorInfo) {
            console.error("ErrorBoundary caught:", error, errorInfo);
        }
        render() {
            if (this.state.hasError) {
                return <div>Something went wrong loading this section.</div>;
            }
            return this.props.children;
        }
    }

    return (
        <Container fluid className="p-4">
            <Tabs defaultActiveKey="compliance" className="mb-3">
                <Tab eventKey="compliance" title="Compliance">
                    <ComplianceChart />
                </Tab>
                <Tab eventKey="finance" title="Risk">
                    <ErrorBoundary>
                        <RiskPerformanceChart data={riskData} sectionNames={riskSectionNames} />
                    </ErrorBoundary>
                </Tab>
                <Tab eventKey="other" title="Other">
                    <p>Other insights coming soon...</p>
                </Tab>
            </Tabs>
        </Container>
    );
};

export default ReportsDashboard;
