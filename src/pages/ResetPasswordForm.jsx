// src/components/auth/ResetPasswordForm.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { Form, Button, Alert, Container, Spinner } from 'react-bootstrap';
import { toast } from "react-toastify";

const ResetPasswordForm = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [token, setToken] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const location = useLocation();
    const navigate = useNavigate();
    const BASE_URL = import.meta.env.VITE_BASE_URL;

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlToken = params.get('token');

        if (urlToken) {
            setToken(urlToken);
            setLoading(false);
        } else {
            setError('Password reset token is missing from the URL.');
            setLoading(false);
        }
    }, [location.search]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!password || !confirmPassword) {
            setError('Please enter and confirm your new password.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        try {
            const response = await axios.post(BASE_URL + 'auth/reset-password', {
                token: token,
                newPassword: password,
            });
            setMessage(response.data);
            toast.success("Password has been reset successfully.");
            setTimeout(() => navigate('/'), 3000);
        } catch (err) {
            const errorMessage = err.response && err.response.data
                ? err.response.data
                : 'An error occurred during password reset. Please try again.';
            setError(errorMessage);
            console.error('Reset password error:', err);
        }
    };

    if (loading) {
        return (
            <Container className="my-5 text-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="mt-2">Loading reset form...</p>
            </Container>
        );
    }

    if (error && !token) { // Only show this error if token was missing initially
        return (
            <Container className="my-5" style={{ maxWidth: '450px' }}>
                <Alert variant="danger" className="text-center">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container className="my-5" style={{ maxWidth: '450px' }}>
            <h2 className="text-center mb-4">Reset Password</h2>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formBasicNewPassword">
                    <Form.Label>New Password</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formBasicConfirmPassword">
                    <Form.Label>Confirm New Password</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100">
                    Reset Password
                </Button>
            </Form>

            {message && <Alert variant="success" className="mt-3 text-center">{message}</Alert>}
            {error && token && <Alert variant="danger" className="mt-3 text-center">{error}</Alert>} {/* Show error only if token was present */}
        </Container>
    );
};

export default ResetPasswordForm;