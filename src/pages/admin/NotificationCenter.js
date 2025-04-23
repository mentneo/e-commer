import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Form, Row, Col, Alert, Spinner, Badge, Table } from 'react-bootstrap';
import { collection, addDoc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-toastify';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import { FaBell, FaSms, FaEnvelope, FaUsers, FaUsersCog } from 'react-icons/fa';

function NotificationCenter() {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationType, setNotificationType] = useState('push');
  const [audienceType, setAudienceType] = useState('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      const notificationsQuery = query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc')
      );
      
      const notificationsSnapshot = await getDocs(notificationsQuery);
      const notificationsData = notificationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()?.toLocaleString() || new Date().toLocaleString()
      }));
      
      setNotifications(notificationsData);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };
  
  const handleNotificationTypeChange = (e) => {
    setNotificationType(e.target.value);
    // Reset title for SMS as it's not used
    if (e.target.value === 'sms') {
      setTitle('');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message) {
      setError('Please enter a message');
      return;
    }
    
    if (notificationType !== 'sms' && !title) {
      setError('Please enter a title');
      return;
    }
    
    try {
      setSending(true);
      setError('');
      setSuccess('');
      
      // In a real implementation, you would integrate with FCM for push notifications
      // and an SMS service provider for SMS notifications
      
      // Create a notification record in Firestore
      const notificationData = {
        type: notificationType,
        audience: audienceType,
        title: title || null,
        message,
        sentBy: 'admin',
        createdAt: serverTimestamp(),
        status: 'sent'
      };
      
      await addDoc(collection(db, 'notifications'), notificationData);
      
      // Simulate sending notifications
      const recipients = audienceType === 'all' ? 'all customers' : 
                      audienceType === 'active' ? 'active customers' : 'VIP customers';
      
      toast.success(`${notificationType.toUpperCase()} notification sent to ${recipients}`);
      setSuccess(`Your ${notificationType} notification has been sent successfully to ${recipients}.`);
      
      // Reset form
      setTitle('');
      setMessage('');
      
      // Refresh notifications list
      fetchNotifications();
    } catch (error) {
      console.error("Error sending notification:", error);
      setError('Failed to send notification. Please try again.');
    } finally {
      setSending(false);
    }
  };
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'push':
        return <FaBell className="me-2" />;
      case 'sms':
        return <FaSms className="me-2" />;
      case 'email':
        return <FaEnvelope className="me-2" />;
      default:
        return <FaBell className="me-2" />;
    }
  };
  
  const getAudienceIcon = (audience) => {
    switch (audience) {
      case 'all':
        return <FaUsers className="me-2" />;
      case 'active':
      case 'vip':
        return <FaUsersCog className="me-2" />;
      default:
        return <FaUsers className="me-2" />;
    }
  };
  
  return (
    <div className="d-flex">
      <AdminSidebar />
      <div className="flex-grow-1">
        <AdminHeader title="Notification Center" />
        <Container fluid className="py-3">
          <Row>
            <Col lg={5} xl={4} className="mb-4">
              <Card className="shadow-sm h-100">
                <Card.Header>
                  <h5 className="mb-0">Send Notification</h5>
                </Card.Header>
                <Card.Body>
                  {error && <Alert variant="danger">{error}</Alert>}
                  {success && <Alert variant="success">{success}</Alert>}
                  
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Notification Type</Form.Label>
                      <div>
                        <Form.Check
                          inline
                          type="radio"
                          id="type-push"
                          name="notificationType"
                          label="Push Notification"
                          value="push"
                          checked={notificationType === 'push'}
                          onChange={handleNotificationTypeChange}
                        />
                        <Form.Check
                          inline
                          type="radio"
                          id="type-sms"
                          name="notificationType"
                          label="SMS"
                          value="sms"
                          checked={notificationType === 'sms'}
                          onChange={handleNotificationTypeChange}
                        />
                        <Form.Check
                          inline
                          type="radio"
                          id="type-email"
                          name="notificationType"
                          label="Email"
                          value="email"
                          checked={notificationType === 'email'}
                          onChange={handleNotificationTypeChange}
                        />
                      </div>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Target Audience</Form.Label>
                      <Form.Select
                        value={audienceType}
                        onChange={(e) => setAudienceType(e.target.value)}
                      >
                        <option value="all">All Customers</option>
                        <option value="active">Active Customers Only</option>
                        <option value="vip">VIP Customers Only</option>
                      </Form.Select>
                    </Form.Group>
                    
                    {notificationType !== 'sms' && (
                      <Form.Group className="mb-3">
                        <Form.Label>Title</Form.Label>
                        <Form.Control
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Enter notification title"
                          required={notificationType !== 'sms'}
                        />
                      </Form.Group>
                    )}
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Message</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={`Enter ${notificationType} message`}
                        required
                      />
                      {notificationType === 'sms' && (
                        <Form.Text className="text-muted">
                          SMS messages should be concise (160 characters max for single SMS).
                        </Form.Text>
                      )}
                    </Form.Group>
                    
                    <div className="d-grid">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={sending}
                      >
                        {sending ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-2"
                            />
                            Sending...
                          </>
                        ) : (
                          'Send Notification'
                        )}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={7} xl={8}>
              <Card className="shadow-sm">
                <Card.Header>
                  <h5 className="mb-0">Notification History</h5>
                </Card.Header>
                <Card.Body>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-3">Loading notifications...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-5">
                      <FaBell size={40} className="text-muted mb-3" />
                      <p>No notifications have been sent yet.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Title/Message</th>
                            <th>Audience</th>
                            <th>Sent At</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {notifications.map(notification => (
                            <tr key={notification.id}>
                              <td>
                                <Badge bg="info" className="text-capitalize">
                                  {getNotificationIcon(notification.type)}
                                  {notification.type}
                                </Badge>
                              </td>
                              <td>
                                {notification.title && (
                                  <div className="fw-bold">{notification.title}</div>
                                )}
                                <div className="text-muted">
                                  {notification.message?.length > 50 
                                    ? `${notification.message.substring(0, 50)}...` 
                                    : notification.message}
                                </div>
                              </td>
                              <td>
                                <Badge bg="secondary" className="text-capitalize">
                                  {getAudienceIcon(notification.audience)}
                                  {notification.audience} customers
                                </Badge>
                              </td>
                              <td>{notification.createdAt}</td>
                              <td>
                                <Badge bg="success">
                                  {notification.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
}

export default NotificationCenter;
