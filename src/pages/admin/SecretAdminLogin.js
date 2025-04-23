import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function SecretAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { adminLogin, currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in as admin
  useEffect(() => {
    if (currentUser && isAdmin) {
      navigate('/admin/dashboard');
    }
  }, [currentUser, isAdmin, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      
      // Input validation
      if (!email || !password || !adminSecret) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }
      
      console.log("Admin login attempt with:", { email, adminSecret: "***" });
      
      await adminLogin(email, password, adminSecret);
      console.log("Admin login successful");
      navigate('/admin/dashboard');
    } catch (error) {
      console.error("Admin login error:", error);
      
      if (error.message.includes("user-not-found") || error.message.includes("wrong-password")) {
        setError('Invalid email or password');
      } else if (error.message.includes("Invalid admin secret")) {
        setError('Invalid admin secret key');
      } else if (error.message.includes("User is not an admin")) {
        setError('Your account does not have admin privileges');
      } else {
        setError(error.message || 'Failed to log in. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card className="shadow">
            <Card.Body>
              <Card.Title className="text-center mb-4">
                <h2>Admin Login</h2>
              </Card.Title>
              
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formEmail">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control 
                    type="email" 
                    placeholder="Enter admin email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formPassword">
                  <Form.Label>Password</Form.Label>
                  <Form.Control 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4" controlId="formAdminSecret">
                  <Form.Label>Admin Secret Key</Form.Label>
                  <Form.Control 
                    type="password" 
                    placeholder="Enter secret key" 
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    required
                  />
                  <Form.Text className="text-muted">
                    This is a special key only provided to system administrators.
                    <div className="mt-1">
                      <strong>Hint:</strong> For testing, use "your-super-secret-admin-key"
                    </div>
                  </Form.Text>
                </Form.Group>

                <div className="d-grid">
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login as Admin'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default SecretAdminLogin;
