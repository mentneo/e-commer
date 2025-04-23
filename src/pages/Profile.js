import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import { db, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';

function Profile() {
  const { currentUser } = useAuth();
  
  const [profile, setProfile] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            // Get user data from Firestore
            const userData = userSnap.data();
            
            setProfile({
              displayName: userData.displayName || currentUser.displayName || '',
              email: userData.email || currentUser.email || '',
              phoneNumber: userData.phoneNumber || currentUser.phoneNumber?.replace('+91', '') || '',
              address: userData.address || {
                street: '',
                city: '',
                state: '',
                pincode: '',
                country: 'India'
              }
            });
          } else {
            // If no user document exists, use Auth data
            setProfile({
              displayName: currentUser.displayName || '',
              email: currentUser.email || '',
              phoneNumber: currentUser.phoneNumber?.replace('+91', '') || '',
              address: {
                street: '',
                city: '',
                state: '',
                pincode: '',
                country: 'India'
              }
            });
          }
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError('Failed to load your profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [currentUser]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value
      }
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');
      setSaving(true);
      
      const userRef = doc(db, 'users', currentUser.uid);
      
      // Update profile in Firestore
      await updateDoc(userRef, {
        displayName: profile.displayName,
        address: profile.address,
        updatedAt: new Date().toISOString()
      });
      
      // Update display name in Firebase Auth
      if (profile.displayName !== currentUser.displayName) {
        await updateAuthProfile(auth.currentUser, {
          displayName: profile.displayName
        });
      }
      
      setSuccess('Profile updated successfully!');
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error("Error updating profile:", err);
      setError('Failed to update profile. Please try again.');
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <>
        <Header />
        <Container className="py-5 text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading your profile...</p>
        </Container>
        <Footer />
      </>
    );
  }
  
  return (
    <>
      <Header />
      <Container className="py-5">
        <h1 className="mb-4">My Profile</h1>
        
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        
        <Row>
          <Col lg={4} className="mb-4">
            <Card>
              <Card.Body className="text-center">
                <div className="mb-3">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${profile.displayName || 'User'}&background=random&size=150`}
                    alt="Profile"
                    className="rounded-circle"
                    style={{ width: '150px', height: '150px' }}
                  />
                </div>
                <h4>{profile.displayName || 'User'}</h4>
                <p className="text-muted">{profile.email || currentUser.email}</p>
                <p className="text-muted">{profile.phoneNumber || currentUser.phoneNumber}</p>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={8}>
            <Card>
              <Card.Header className="bg-white">
                <h5 className="mb-0">Edit Profile</h5>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="displayName"
                      value={profile.displayName}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="email"
                          value={profile.email}
                          disabled
                        />
                        <Form.Text className="text-muted">
                          Email cannot be changed.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Phone Number</Form.Label>
                        <Form.Control
                          type="tel"
                          value={profile.phoneNumber}
                          disabled
                        />
                        <Form.Text className="text-muted">
                          Phone number cannot be changed.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <hr className="my-4" />
                  
                  <h5 className="mb-3">Address Information</h5>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Street Address</Form.Label>
                    <Form.Control
                      type="text"
                      name="street"
                      value={profile.address.street}
                      onChange={handleAddressChange}
                    />
                  </Form.Group>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>City</Form.Label>
                        <Form.Control
                          type="text"
                          name="city"
                          value={profile.address.city}
                          onChange={handleAddressChange}
                        />
                      </Form.Group>
                    </Col>
                    
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>State</Form.Label>
                        <Form.Control
                          type="text"
                          name="state"
                          value={profile.address.state}
                          onChange={handleAddressChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>PIN Code</Form.Label>
                        <Form.Control
                          type="text"
                          name="pincode"
                          value={profile.address.pincode}
                          onChange={handleAddressChange}
                        />
                      </Form.Group>
                    </Col>
                    
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Country</Form.Label>
                        <Form.Control
                          type="text"
                          name="country"
                          value={profile.address.country}
                          onChange={handleAddressChange}
                          disabled
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <div className="d-grid gap-2 mt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Saving...
                        </>
                      ) : 'Save Changes'}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      <Footer />
    </>
  );
}

export default Profile;
