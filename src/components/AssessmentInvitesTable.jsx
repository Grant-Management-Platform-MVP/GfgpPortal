import React from 'react';
import { Table, Button } from 'react-bootstrap';

const AssessmentInvitesTable = ({ data, onStartAssessment }) => {
    const validInvites = data.filter(({ assessment }) => assessment !== null);
    const showTieredLevelColumn = validInvites.some(
        (row) => row.invite.structureType?.toLowerCase() === 'tiered'
    );

    return (
        <div>
            <h5 className="mb-3 text-center">Your Assessment Invitations From Funders</h5>
            <Table striped bordered hover responsive>
                <thead className="table-light">
                    <tr>
                        <th>#</th>
                        <th>Structure</th>
                        {showTieredLevelColumn && <th>Tiered Level</th>}
                        <th>Invited By</th>
                        <th>Date Invited</th>
                        <th>Assessment</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {validInvites.length === 0 ? (
                        <tr>
                            <td colSpan={showTieredLevelColumn ? "7" : "6"} className="text-center">No valid assessment invites found.</td>
                        </tr>
                    ) : (
                        validInvites.map((row, index) => {
                            const { invite, assessment } = row;
                            const structure = invite.structureType?.toUpperCase();
                            const tieredLevel = invite.tieredLevel;

                            return (
                                <tr key={invite.id}>
                                    <td>{index + 1}</td>
                                    <td>{structure}</td>
                                    {/* Conditional TD for Tiered Level */}
                                    {showTieredLevelColumn && (
                                        <td>
                                            {/* Display the tieredLevel if present, otherwise 'N/A' or empty */}
                                            {structure === 'TIERED' && tieredLevel
                                                ? tieredLevel.charAt(0).toUpperCase() + tieredLevel.slice(1)
                                                : '—' // Display dash for non-tiered or missing tieredLevel
                                            }
                                        </td>
                                    )}
                                    <td>{invite.invitedBy}</td>
                                    <td>{new Date(invite.dateInvited).toLocaleString()}</td>
                                    <td>{assessment.title || '—'}</td>
                                    <td>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => onStartAssessment(invite)}
                                        >
                                            Start Assessment
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </Table>
        </div>
    );
};

export default AssessmentInvitesTable;