import React from 'react';
import { Table, Button } from 'react-bootstrap';

const AssessmentInvitesTable = ({ data, onStartAssessment }) => {
    const validInvites = data.filter(({ assessment }) => assessment !== null);

    return (
        <div>
            <h4 className="mb-3">Your Assessment Invitations</h4>
            <Table striped bordered hover responsive>
                <thead className="table-light">
                    <tr>
                        <th>#</th>
                        <th>Structure</th>
                        <th>Invited By</th>
                        <th>Date Invited</th>
                        <th>Assessment</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {validInvites.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="text-center">No valid assessment invites found.</td>
                        </tr>
                    ) : (
                        validInvites.map((row, index) => {
                            const { invite, assessment } = row;
                            const structure = invite.structureType?.toUpperCase();

                            return (
                                <tr key={invite.id}>
                                    <td>{index + 1}</td>
                                    <td>{structure}</td>
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