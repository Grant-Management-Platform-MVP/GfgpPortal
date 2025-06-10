import React, { useEffect, useState } from 'react';
import { Table, Button, Spinner, Alert, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AssessmentInvitesTable from '@components/AssessmentInvitesTable';


const statusVariantMap = {
    SAVED: 'secondary',
    SUBMITTED: 'success',
    SENT_BACK: 'warning',
};

const statusTooltips = {
    SAVED: 'Draft saved, continue editing',
    SUBMITTED: 'Assessment submitted and locked',
    SENT_BACK: 'Assessment sent back for corrections',
};

const AssessmentListPage = () => {
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const BASE_URL = import.meta.env.VITE_BASE_URL;
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.userId;
    const [invitesData, setInvitesData] = useState([]);


    const handleStartAssessment = (invite) => {
        navigate(`/grantee/assessment-invite/${invite.id}/${invite.tieredLevel}`, {
            state: { invite },
        });
    };


    useEffect(() => {
        const fetchInvites = async () => {
            try {
                const response = await fetch(`${BASE_URL}gfgp/assessment-invites/${userId}`);
                const result = await response.json();
                setInvitesData(result);
            } catch (error) {
                console.error('Error fetching invites:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInvites();
    }, []);

    useEffect(() => {
        const fetchAssessments = async () => {
            try {
                const res = await axios.get(`${BASE_URL}gfgp/assessment/${userId}`);
                setAssessments(res.data);
            } catch (err) {
                setError('Failed to load assessments.', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAssessments();
    }, [userId]);

    const handleNavigate = (id, status) => {
        let url = '/grantee/questionnaire';

        if (status === 'SENT_BACK') url += '?mode=fix';
        else if (status === 'SUBMITTED') url += '?mode=view';
        else if (status === 'SAVED') url += '?mode=edit';

        navigate(url);
    };

    const getButtonLabel = (status) => {
        switch (status) {
            case 'SENT_BACK': return 'Fix & Resubmit';
            case 'SAVED': return 'Continue Draft';
            case 'SUBMITTED': return 'View Submission';
            default: return 'Start Assessment';
        }
    };

    // Friendly date formatter
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    return (
        <div className="container py-4">
            <h3 className="mb-4">Your GFGP Assessments</h3>

            {loading && (
                <div className="d-flex justify-content-center my-5">
                    <Spinner animation="border" variant="primary" />
                </div>
            )}

            {error && <Alert variant="danger">{error}</Alert>}

            {!loading && assessments.length === 0 && (
                <Alert variant="info" className="text-center">
                    No assessments found yet.<br />
                    To get started, you'll need to first select your preffered assessment structure (Foundation, Advanced, or Tiered).<br />
                    Once you've <Button variant="link" onClick={() => navigate('/grantee/select-structure')}>made a selection</Button>, you can begin your first assessment.
                    <div className="mt-2">
                        <Button variant="link" onClick={() => navigate('/grantee/questionnaire')}>
                            Start your first assessment
                        </Button>
                    </div>
                </Alert>
            )}

            {!loading && assessments.length > 0 && (
                <Table striped bordered hover responsive className="shadow-sm rounded">
                    <thead className="table-light">
                        <tr>
                            <th>#</th>
                            <th>Structure</th>
                            <th>Version</th>
                            <th>Status</th>
                            <th>Last Updated</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assessments.map((a, idx) => {
                            const buttonVariant = a.status === 'SENT_BACK' ? 'warning'
                                : a.status === 'SAVED' ? 'primary'
                                    : 'outline-primary';

                            return (
                                <tr
                                    key={a.id}
                                    className="align-middle"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleNavigate(a.id, a.status)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleNavigate(a.id, a.status); }}
                                    tabIndex={0}
                                >
                                    <td>{idx + 1}</td>
                                    <td>{a.structure}</td>
                                    <td>{a.version}</td>
                                    <td>
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={<Tooltip>{statusTooltips[a.status] || 'Unknown status'}</Tooltip>}
                                        >
                                            <Badge bg={statusVariantMap[a.status] || 'dark'} style={{ cursor: 'default' }}>
                                                {a.status}
                                            </Badge>
                                        </OverlayTrigger>
                                    </td>
                                    <td>{formatDate(a.lastUpdated)}</td>
                                    <td>
                                        <Button
                                            variant={buttonVariant}
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation(); // prevent row onClick
                                                handleNavigate(a.id, a.status);
                                            }}
                                            disabled={loading}
                                        >
                                            {getButtonLabel(a.status)}
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            )}
            {/* Invite table */}
            {loading ? (
                <p>Loading invitations...</p>
            ) : (
                <AssessmentInvitesTable
                    data={invitesData}
                    onStartAssessment={handleStartAssessment}
                />
            )}
        </div>
    );
};

export default AssessmentListPage;