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

    const margin = { top: 60, right: 30, bottom: 40, left: 180 };
    const CHART_BASE_WIDTH = 800;
    const BAR_HEIGHT = 20;
    const BAR_PADDING = 10;
    const MIN_CHART_HEIGHT = 300;

    const getComplianceColor = (value) => {
        if (value >= 80) return '#007bff'; // Blue (High compliance)
        if (value >= 50) return '#17a2b8'; // Teal (Medium compliance)
        return '#6c757d'; // Grey (Low compliance)
    };

    const getCompletenessColor = (value) => {
        if (value >= 80) return '#28a745'; // Green (High completeness)
        if (value >= 50) return '#ffc107'; // Yellow (Medium completeness)
        return '#dc3545'; // Red (Low completeness)
    };

    const fetchComplianceData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${BASE_URL}gfgp/reports/compliance-progress`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            const transformedData = data.map(item => ({
                grantee: item.granteeName || 'Unnamed Grantee',
                completeness: parseFloat(item.completeness.toFixed(2)),
                compliance: parseFloat(item.compliance.toFixed(2))
            }));

            transformedData.sort((a, b) => a.grantee.localeCompare(b.grantee));

            setChartData(transformedData);
        } catch (error) {
            console.error('Failed to fetch compliance data:', error);
            setChartData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplianceData();
    }, [BASE_URL]);

    useEffect(() => {
        if (!loading && chartRef.current) {
            if (chartData.length > 0) {
                renderChart(chartData);
            } else {
                const svg = d3.select(chartRef.current);
                svg.selectAll("*").remove();
                svg.attr("width", CHART_BASE_WIDTH + margin.left + margin.right)
                    .attr("height", MIN_CHART_HEIGHT + margin.top + margin.bottom);
                svg.append("text")
                    .attr("x", (CHART_BASE_WIDTH + margin.left + margin.right) / 2)
                    .attr("y", (MIN_CHART_HEIGHT + margin.top + margin.bottom) / 2)
                    .attr("text-anchor", "middle")
                    .attr("fill", "#6c757d")
                    .attr("font-size", "16px")
                    .text("No compliance data available.");
            }
        }
    }, [chartData, loading]);

    const renderChart = (data) => {
        const svg = d3.select(chartRef.current);

        const chartHeight = data.length * (2 * BAR_HEIGHT + BAR_PADDING);
        const svgHeight = Math.max(MIN_CHART_HEIGHT, chartHeight) + margin.top + margin.bottom;
        const svgWidth = CHART_BASE_WIDTH + margin.left + margin.right;

        svg.attr("width", svgWidth)
            .attr("height", svgHeight);

        svg.selectAll("g, rect, text, defs, .tooltip-container").remove();

        const chartArea = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const y = d3.scaleBand()
            .domain(data.map(d => d.grantee))
            .range([0, chartHeight])
            .paddingInner(BAR_PADDING / (2 * BAR_HEIGHT + BAR_PADDING));

        const x = d3.scaleLinear()
            .domain([0, 100])
            .range([0, CHART_BASE_WIDTH]);

        // Y-axis
        chartArea.append("g")
            .call(d3.axisLeft(y).tickSizeOuter(0))
            .selectAll("text")
            .attr("font-size", "12px");

        // X-axis
        chartArea.append("g")
            .attr("transform", `translate(0, ${chartHeight})`)
            .call(d3.axisBottom(x).ticks(5).tickFormat(d => d + "%"));

        const tooltip = d3.select("#tooltip");

        const complianceBars = chartArea.selectAll(".bar-compliance")
            .data(data, d => d.grantee);

        complianceBars.enter()
            .append("rect")
            .attr("class", "bar-compliance")
            .attr("y", d => y(d.grantee))
            .attr("height", BAR_HEIGHT)
            .attr("x", 0)
            .attr("fill", d => getComplianceColor(d.compliance))
            .attr("width", 0)
            .merge(complianceBars)
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

        complianceBars.exit()
            .transition()
            .duration(500)
            .attr("width", 0)
            .remove();


        const completenessBars = chartArea.selectAll(".bar-completeness")
            .data(data, d => d.grantee);

        completenessBars.enter()
            .append("rect")
            .attr("class", "bar-completeness")
            .attr("y", d => y(d.grantee) + BAR_HEIGHT + (BAR_PADDING / 2))
            .attr("height", BAR_HEIGHT)
            .attr("x", 0)
            .attr("fill", d => getCompletenessColor(d.completeness))
            .attr("width", 0)
            .merge(completenessBars)
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

        completenessBars.exit()
            .transition()
            .duration(500)
            .attr("width", 0)
            .remove();

        const complianceLabels = chartArea.selectAll(".label-compliance")
            .data(data, d => d.grantee);

        complianceLabels.enter()
            .append("text")
            .attr("class", "label-compliance")
            .attr("x", 5)
            .attr("y", d => y(d.grantee) + BAR_HEIGHT / 2 + 4)
            .attr("font-size", "11px")
            .attr("fill", "#333")
            .text(d => `${d.compliance}%`)
            .merge(complianceLabels)
            .transition()
            .duration(800)
            .attr("x", d => x(d.compliance) + 5);

        complianceLabels.exit()
            .transition()
            .duration(500)
            .attr("opacity", 0)
            .remove();

        const completenessLabels = chartArea.selectAll(".label-completeness")
            .data(data, d => d.grantee);

        completenessLabels.enter()
            .append("text")
            .attr("class", "label-completeness")
            .attr("x", 5)
            .attr("y", d => y(d.grantee) + BAR_HEIGHT + BAR_HEIGHT / 2 + 4 + (BAR_PADDING / 2))
            .attr("font-size", "11px")
            .attr("fill", "#333")
            .text(d => `${d.completeness}%`)
            .merge(completenessLabels)
            .transition()
            .duration(800)
            .attr("x", d => x(d.completeness) + 5);

        completenessLabels.exit()
            .transition()
            .duration(500)
            .attr("opacity", 0)
            .remove();


        const legendData = [
            { label: "Compliance", color: getComplianceColor(100) },
            { label: "Completeness", color: getCompletenessColor(100) }
        ];

        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${margin.left}, 15)`);

        legend.selectAll("rect")
            .data(legendData)
            .enter()
            .append("rect")
            .attr("x", (d, i) => i * 120)
            .attr("y", 0)
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", d => d.color);

        legend.selectAll("text")
            .data(legendData)
            .enter()
            .append("text")
            .attr("x", (d, i) => i * 120 + 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .text(d => d.label)
            .attr("font-size", "12px")
            .attr("fill", "#333");
    };


    const exportPNG = () => {
        html2canvas(document.getElementById("chart-wrapper"), {
            scale: 2
        }).then((canvas) => {
            canvas.toBlob((blob) => saveAs(blob, "compliance-progress.png"));
        });
    };

    const exportPDF = () => {
        const chartElement = document.getElementById("chart-wrapper");

        html2canvas(chartElement, {
            scale: 2
        }).then((canvas) => {
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
                    <Button variant="primary" className="me-2" onClick={exportPNG} disabled={loading || chartData.length === 0}>Export as PNG</Button>
                    <Button variant="success" className="me-2" onClick={exportPDF} disabled={loading || chartData.length === 0}>Export as PDF</Button>
                    <Button variant="warning" onClick={exportCSV} disabled={loading || chartData.length === 0}>Export as CSV</Button>
                </Col>
            </Row>
            <div id="chart-wrapper">
                <div id="tooltip" style={{
                    position: 'absolute',
                    visibility: 'hidden',
                    backgroundColor: '#fff',
                    border: '1px solid solid #ccc',
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
            setRiskData(data);

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