import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tab, Nav } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';

function Login() {
  // Email login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone login states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, currentUser, setupRecaptcha } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);
  
  // Email login handler
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      toast.success('Login successful!');
      navigate('/');
    } catch (err) {
      setError('Failed to sign in. Please check your credentials.');
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Send OTP handler
  const handleSendOtp = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      
      // Format phone number
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      
      // Setup recaptcha and send OTP
      const confirmation = await setupRecaptcha(formattedPhone);
      setConfirmationResult(confirmation);
      setShowOtpField(true);
      toast.success('OTP sent successfully!');
    } catch (err) {
      setError('Failed to send OTP. Please check your phone number.');
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };
  
  // Verify OTP handler
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (!confirmationResult) {
      setError('Something went wrong. Please try again.');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Verify OTP
      await confirmationResult.confirm(otp);
      toast.success('Phone number verified!');
      navigate('/');
    } catch (err) {
      setError('Invalid OTP. Please try again.');
      toast.error('OTP verification failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Header />
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <Card className="shadow">
              <Card.Body className="p-4">
                <h2 className="text-center mb-4">Login</h2>
                
                {error && <Alert variant="danger">{error}</Alert>}
                
                <Tab.Container defaultActiveKey="email">
                  <Nav variant="pills" className="mb-3 justify-content-center">
                    <Nav.Item>
                      <Nav.Link eventKey="email">Email</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="phone">Phone</Nav.Link>
                    </Nav.Item>
                  </Nav>
                  
                  <Tab.Content>
                    {/* Email Login */}
                    <Tab.Pane eventKey="email">
                      <Form onSubmit={handleEmailLogin}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                          <Form.Label>Password</Form.Label>
                          <Form.Control
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </Form.Group>
                        
                        <Button
                          type="submit"
                          variant="primary"
                          className="w-100 mt-3"
                          disabled={loading}
                        >
                          {loading ? 'Logging in...' : 'Login'}
                        </Button>
                      </Form>
                    </Tab.Pane>
                    
                    {/* Phone Login */}
                    <Tab.Pane eventKey="phone">
                      <div id="recaptcha-container"></div>
                      
                      {!showOtpField ? (
                        <Form onSubmit={handleSendOtp}>
                          <Form.Group className="mb-3">
                            <Form.Label>Phone Number</Form.Label>
                            <Form.Control
                              type="tel"
                              placeholder="Enter your 10-digit number"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              required
                            />
                            <Form.Text className="text-muted">
                              We'll send an OTP to this number
                            </Form.Text>
                          </Form.Group>
                          
                          <Button
                            type="submit"
                            variant="primary"
                            className="w-100 mt-3"
                            disabled={loading}
                          >
                            {loading ? 'Sending OTP...' : 'Send OTP'}
                          </Button>
                        </Form>
                      ) : (
                        <Form onSubmit={handleVerifyOtp}>
                          <Form.Group className="mb-3">
                            <Form.Label>Enter OTP</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="6-digit OTP"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value)}
                              required
                            />
                          </Form.Group>
                          
                          <Button
                            type="submit"
                            variant="primary"
                            className="w-100 mt-3"
                            disabled={loading}
                          >
                            {loading ? 'Verifying...' : 'Verify OTP'}
                          </Button>
                        </Form>
                      )}
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>
                
                <div className="text-center mt-4">
                  <p>Don't have an account? <Link to="/register">Register</Link></p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      <Footer />
    </>
  );
}

export default Login;
