import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tab, Nav } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';

function Register() {
  // Email registration states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  
  // Phone registration states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signup, setupRecaptcha, createUserProfile, currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);
  
  // Email registration handler
  const handleEmailRegister = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Create user with email and password
      const userCredential = await signup(email, password);
      
      // Create user profile in Firestore
      await createUserProfile(userCredential.user, {
        displayName: name,
      });
      
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      setError('Failed to create account: ' + err.message);
      toast.error('Registration failed');
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
  
  // Verify OTP and register handler
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (!confirmationResult) {
      setError('Something went wrong. Please try again.');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Verify OTP and get user credential
      const userCredential = await confirmationResult.confirm(otp);
      
      // Create user profile in Firestore
      await createUserProfile(userCredential.user, {
        displayName: name,
      });
      
      toast.success('Phone number verified and account created!');
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
                <h2 className="text-center mb-4">Register</h2>
                
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
                    {/* Email Registration */}
                    <Tab.Pane eventKey="email">
                      <Form onSubmit={handleEmailRegister}>
                        <Form.Group className="mb-3">
                          <Form.Label>Full Name</Form.Label>
                          <Form.Control
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </Form.Group>
                        
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
                            minLength="6"
                          />
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                          <Form.Label>Confirm Password</Form.Label>
                          <Form.Control
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength="6"
                          />
                        </Form.Group>
                        
                        <Button
                          type="submit"
                          variant="primary"
                          className="w-100 mt-3"
                          disabled={loading}
                        >
                          {loading ? 'Creating Account...' : 'Register'}
                        </Button>
                      </Form>
                    </Tab.Pane>
                    
                    {/* Phone Registration */}
                    <Tab.Pane eventKey="phone">
                      <div id="recaptcha-container"></div>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Full Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </Form.Group>
                      
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
                            disabled={loading || !name}
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
                            {loading ? 'Verifying...' : 'Verify & Register'}
                          </Button>
                        </Form>
                      )}
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>
                
                <div className="text-center mt-4">
                  <p>Already have an account? <Link to="/login">Login</Link></p>
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

export default Register;
