// src/components/auth/ForgotPasswordRequestForm.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Alert, Container, Spinner } from 'react-bootstrap';
import { toast } from "react-toastify";

const ForgotPasswordRequestForm = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const BASE_URL = import.meta.env.VITE_BASE_URL;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        if (!email) {
            setError('Please enter your email address.');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(BASE_URL + 'auth/forgot-password', { email });
            toast.success("If an account with that email exists, a password reset link has been sent.");
            setMessage(response.data?.message || "Check your email for further instructions.");
            setTimeout(() => navigate('/'), 3000);
        } catch (err) {
            console.error('Forgot password error:', err);
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="my-5" style={{ maxWidth: '420px' }}>
            <div className="text-center mb-4">
                <h2 className="fw-bold">Forgot Password?</h2>
                <p className="text-center my-4">
                    Enter your email and we’ll send a reset link to help you get back in.
                </p>
            </div>

            <Form onSubmit={handleSubmit}>
                <Form.Group controlId="formBasicEmail" className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />
                </Form.Group>

                <Button
                    variant="primary"
                    type="submit"
                    className="w-100"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Spinner
                                animation="border"
                                role="status"
                                size="sm"
                                className="me-2"
                            />
                            Sending...
                        </>
                    ) : (
                        'Send Reset Link'
                    )}
                </Button>
            </Form>

            {message && (
                <Alert variant="success" className="mt-3 text-center">
                    {message}
                </Alert>
            )}
            {error && (
                <Alert variant="danger" className="mt-3 text-center">
                    {error}
                </Alert>
            )}

            <div className="text-center mt-4">
                <p className="mb-0">
                    Remember your password?{' '}
                    <a href="/" className="fw-semibold text-decoration-none">
                        Log in
                    </a>
                </p>
            </div>
        </Container>
    );
};

export default ForgotPasswordRequestForm;