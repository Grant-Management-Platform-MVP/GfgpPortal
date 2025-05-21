import React, { useEffect, useState, useRef } from 'react';
import { Modal, Button } from 'react-bootstrap';

const SESSION_TIMEOUT = 15 * 60 * 1000; // 5 minutes in ms
const WARNING_TIME = 1 * 60 * 1000; // 1 minute before timeout

const SessionTimeoutWarning = ({ onLogout }) => {
  const [showWarning, setShowWarning] = useState(false);
  const timerId = useRef(null);
  const warningTimerId = useRef(null);

  const resetTimers = () => {
    if (timerId.current) clearTimeout(timerId.current);
    if (warningTimerId.current) clearTimeout(warningTimerId.current);

    warningTimerId.current = setTimeout(() => {
      setShowWarning(true);
    }, SESSION_TIMEOUT - WARNING_TIME);

    timerId.current = setTimeout(() => {
      onLogout();
    }, SESSION_TIMEOUT);
  };

  useEffect(() => {
    resetTimers();

    const events = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    const resetOnActivity = () => {
      setShowWarning(false);
      resetTimers();
    };

    events.forEach(event => window.addEventListener(event, resetOnActivity));

    return () => {
      if (timerId.current) clearTimeout(timerId.current);
      if (warningTimerId.current) clearTimeout(warningTimerId.current);
      events.forEach(event => window.removeEventListener(event, resetOnActivity));
    };
  }, []);

  return (
    <Modal show={showWarning} onHide={() => setShowWarning(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>Session Timeout Warning</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        You will be logged out in 1 minute due to inactivity.
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={() => {
          setShowWarning(false);
          resetTimers();
        }}>
          Stay Logged In
        </Button>
        <Button variant="danger" onClick={onLogout}>
          Logout Now
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SessionTimeoutWarning;