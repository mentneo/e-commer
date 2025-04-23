import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Form, Button, Table, Badge, Modal, Alert } from 'react-bootstrap';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaBell, FaEdit, FaTrash, FaUsers, FaUserAlt } from 'react-icons/fa';

function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentNotification, setCurrentNotification] = useState({
    title: '',
    message: '',
    type: 'info',
    audience: 'all',
    targetUserIds: [],
    expiresAt: '',
    isActive: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Fetch notifications and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch notifications
        const notificationsQuery = query(
          collection(db, 'notifications'), 
          orderBy('createdAt', 'desc')
        );
        const notificationsSnapshot = await getDocs(notificationsQuery);
        
        const notificationsData = [];
        notificationsSnapshot.forEach((doc) => {
          notificationsData.push({ 
            id: doc.id, 
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
            expiresAt: doc.data().expiresAt?.toDate ? doc.data().expiresAt.toDate() : null
          });
        });
        
        setNotifications(notificationsData);
        
        // Fetch users for targeting
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        
        const usersData = [];
        usersSnapshot.forEach((doc) => {
          usersData.push({ id: doc.id, ...doc.data() });
        });
        
        setUsers(usersData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load notifications. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentNotification({
      ...currentNotification,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Open modal for adding new notification
  const handleAddNotification = () => {
    // Set expiry date to 7 days from now by default
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 7);
    
    setCurrentNotification({
      title: '',
      message: '',
      type: 'info',
      audience: 'all',
      targetUserIds: [],
      expiresAt: defaultExpiry.toISOString().split('T')[0],
      isActive: true
    });
    setSelectedUsers([]);
    setIsEditing(false);
    setShowModal(true);
  };

  // Open modal for editing notification
  const handleEditNotification = (notification) => {
    // Format the expiresAt date for the date input
    let formattedExpiresAt = '';
    if (notification.expiresAt) {
      const expiryDate = new Date(notification.expiresAt);
      formattedExpiresAt = expiryDate.toISOString().split('T')[0];
    }
    
    setCurrentNotification({
      ...notification,
      expiresAt: formattedExpiresAt
    });
    
    setSelectedUsers(
      notification.targetUserIds 
        ? users.filter(user => notification.targetUserIds.includes(user.id))
        : []
    );
    
    setIsEditing(true);
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Create expiry date
      const expiryDate = currentNotification.expiresAt 
        ? new Date(currentNotification.expiresAt)
        : null;
      
      // Prepare notification data
      const notificationData = {
        title: currentNotification.title,
        message: currentNotification.message,
        type: currentNotification.type,
        audience: currentNotification.audience,
        targetUserIds: currentNotification.audience === 'specific' 
          ? selectedUsers.map(user => user.id)
          : [],
        isActive: currentNotification.isActive,
        expiresAt: expiryDate ? Timestamp.fromDate(expiryDate) : null,
        updatedAt: Timestamp.now()
      };
      
      if (isEditing) {
        // Update existing notification
        await updateDoc(doc(db, 'notifications', currentNotification.id), notificationData);
        
        // Update local state
        setNotifications(prev => 
          prev.map(item => 
            item.id === currentNotification.id 
              ? { 
                  ...item, 
                  ...notificationData, 
                  expiresAt: expiryDate
                } 
              : item
          )
        );
      } else {
        // Add new notification
        const docRef = await addDoc(collection(db, 'notifications'), {
          ...notificationData,
          createdAt: Timestamp.now(),
          readBy: []
        });
        
        // Update local state
        setNotifications(prev => [
          { 
            id: docRef.id, 
            ...notificationData, 
            createdAt: new Date(),
            expiresAt: expiryDate,
            readBy: []
          },
          ...prev
        ]);
      }
      
      setShowModal(false);
      setError(null);
    } catch (err) {
      console.error('Error saving notification:', err);
      setError('Failed to save notification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete a notification
  const handleDeleteNotification = async (id) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        setLoading(true);
        await deleteDoc(doc(db, 'notifications', id));
        
        // Update local state
        setNotifications(prev => prev.filter(item => item.id !== id));
        setError(null);
      } catch (err) {
        console.error('Error deleting notification:', err);
        setError('Failed to delete notification. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Toggle notification active status
  const handleToggleActive = async (notification) => {
    try {
      setLoading(true);
      
      await updateDoc(doc(db, 'notifications', notification.id), {
        isActive: !notification.isActive,
        updatedAt: Timestamp.now()
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(item => 
          item.id === notification.id 
            ? { ...item, isActive: !item.isActive } 
            : item
        )
      );
      
      setError(null);
    } catch (err) {
      console.error('Error updating notification status:', err);
      setError('Failed to update notification status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter users for targeting
  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.phone?.includes(userSearchTerm)
  );

  // Toggle user selection
  const toggleUserSelection = (user) => {
    if (selectedUsers.some(u => u.id === user.id)) {
      setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers(prev => [...prev, user]);
    }
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  return (
    <Container className="py-4">
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Notification Center</h4>
          <Button 
            variant="light" 
            onClick={handleAddNotification}
          >
            <FaBell className="me-2" /> Create Notification
          </Button>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          {loading && <div className="text-center py-4">Loading notifications...</div>}
          
          <Table responsive hover>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Audience</th>
                <th>Created</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    No notifications found. Create your first notification!
                  </td>
                </tr>
              ) : (
                notifications.map(notification => (
                  <tr key={notification.id}>
                    <td>{notification.title}</td>
                    <td>
                      <Badge bg={notification.type === 'info' ? 'info' : notification.type === 'success' ? 'success' : notification.type === 'warning' ? 'warning' : 'danger'}>
                        {notification.type}
                      </Badge>
                    </td>
                    <td>
                      {notification.audience === 'all' ? (
                        <Badge bg="primary">All Users</Badge>
                      ) : (
                        <Badge bg="info">Specific Users</Badge>
                      )}
                    </td>
                    <td>{formatDate(notification.createdAt)}</td>
                    <td>{formatDate(notification.expiresAt)}</td>
                    <td>
                      <Form.Check
                        type="switch"
                        id={`status-${notification.id}`}
                        checked={notification.isActive}
                        onChange={() => handleToggleActive(notification)}
                        label={notification.isActive ? 'Active' : 'Inactive'}
                      />
                    </td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        className="me-2"
                        onClick={() => handleEditNotification(notification)}
                      >
                        <FaEdit /> Edit
                      </Button>
                      <Button 
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteNotification(notification.id)}
                      >
                        <FaTrash /> Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Notification Form Modal */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? 'Edit Notification' : 'Create New Notification'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Title*</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={currentNotification.title}
                onChange={handleInputChange}
                required
                placeholder="Notification title"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Message*</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="message"
                value={currentNotification.message}
                onChange={handleInputChange}
                required
                placeholder="Notification message content"
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    name="type"
                    value={currentNotification.type}
                    onChange={handleInputChange}
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="danger">Important</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Audience</Form.Label>
                  <Form.Select
                    name="audience"
                    value={currentNotification.audience}
                    onChange={handleInputChange}
                  >
                    <option value="all">All Users</option>
                    <option value="specific">Specific Users</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            {currentNotification.audience === 'specific' && (
              <Card className="mb-3">
                <Card.Header>
                  <Form.Control
                    type="text"
                    placeholder="Search users by name or email"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="mt-2"
                  />
                </Card.Header>
                <Card.Body style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <div className="mb-2">
                    Selected: {selectedUsers.length} users
                  </div>
                  <div>
                    {filteredUsers.map(user => (
                      <div 
                        key={user.id} 
                        className="d-flex align-items-center py-2 border-bottom"
                      >
                        <Form.Check
                          type="checkbox"
                          id={`user-${user.id}`}
                          checked={selectedUsers.some(u => u.id === user.id)}
                          onChange={() => toggleUserSelection(user)}
                          label={
                            <div className="ms-2">
                              <div><strong>{user.name || 'Unnamed User'}</strong></div>
                              <div className="text-muted small">{user.email || 'No email'}</div>
                            </div>
                          }
                        />
                      </div>
                    ))}
                    
                    {filteredUsers.length === 0 && (
                      <div className="text-center py-3">
                        No users match your search
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            )}
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Expiry Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="expiresAt"
                    value={currentNotification.expiresAt}
                    onChange={handleInputChange}
                  />
                  <Form.Text className="text-muted">
                    When this notification should expire. Leave empty for no expiry.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3 d-flex align-items-center">
                  <Form.Check
                    type="switch"
                    id="notification-active"
                    name="isActive"
                    checked={currentNotification.isActive}
                    onChange={handleInputChange}
                    label="Active"
                    className="mt-4"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end gap-2 mt-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Saving...' : (isEditing ? 'Update Notification' : 'Create Notification')}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      
      {/* Notification Stats */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Notification Statistics</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3} className="mb-3">
              <Card className="text-center" bg="primary" text="white">
                <Card.Body>
                  <h3>{notifications.length}</h3>
                  <p className="mb-0">Total Notifications</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="text-center" bg="success" text="white">
                <Card.Body>
                  <h3>{notifications.filter(n => n.isActive).length}</h3>
                  <p className="mb-0">Active Notifications</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="text-center" bg="info" text="white">
                <Card.Body>
                  <h3>{notifications.filter(n => n.audience === 'all').length}</h3>
                  <p className="mb-0">Global Notifications</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="text-center" bg="warning" text="white">
                <Card.Body>
                  <h3>{notifications.filter(n => n.audience === 'specific').length}</h3>
                  <p className="mb-0">Targeted Notifications</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default NotificationCenter;
