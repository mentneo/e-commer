import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Form, InputGroup, Button, Modal, Badge } from 'react-bootstrap';
import { collection, getDocs, doc, getDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaSearch, FaFilter, FaEdit, FaEye, FaUserAlt, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import AdminLayout from '../../components/AdminLayout';

function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    status: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  // Fetch customers and their data
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        
        const customersQuery = query(
          collection(db, 'users'),
          where('role', '==', 'customer'),
          orderBy('createdAt', 'desc')
        );
        
        const customersSnapshot = await getDocs(customersQuery);
        
        const customersData = [];
        customersSnapshot.forEach((doc) => {
          customersData.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
          });
        });
        
        setCustomers(customersData);
        setFilteredCustomers(customersData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching customers:', error);
        setLoading(false);
      }
    };
    
    fetchCustomers();
  }, []);

  // Filter customers when search or filter changes
  useEffect(() => {
    let results = [...customers];
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      results = results.filter(customer => 
        (customer.name && customer.name.toLowerCase().includes(searchLower)) ||
        (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
        (customer.phone && customer.phone.includes(searchTerm))
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      results = results.filter(customer => customer.status === statusFilter);
    }
    
    setFilteredCustomers(results);
  }, [searchTerm, statusFilter, customers]);

  // View customer details
  const handleViewCustomer = async (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
    
    try {
      // Fetch customer's orders
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', customer.id),
        orderBy('createdAt', 'desc')
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      
      const ordersData = [];
      ordersSnapshot.forEach((doc) => {
        ordersData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
        });
      });
      
      setCustomerOrders(ordersData);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      setCustomerOrders([]);
    }
  };

  // Open edit modal
  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setEditForm({
      status: customer.status || 'active',
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || ''
    });
    setShowEditModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save customer changes
  const handleSaveCustomer = async () => {
    try {
      setLoading(true);
      
      await updateDoc(doc(db, 'users', selectedCustomer.id), {
        status: editForm.status,
        name: editForm.name,
        phone: editForm.phone,
        address: editForm.address,
        notes: editForm.notes,
        updatedAt: new Date()
      });
      
      // Update local state
      const updatedCustomers = customers.map(c => 
        c.id === selectedCustomer.id 
          ? {
              ...c,
              status: editForm.status,
              name: editForm.name,
              phone: editForm.phone,
              address: editForm.address,
              notes: editForm.notes
            }
          : c
      );
      
      setCustomers(updatedCustomers);
      setShowEditModal(false);
      
      // If customer details modal is open, update the selected customer there too
      if (showCustomerModal) {
        setSelectedCustomer({
          ...selectedCustomer,
          status: editForm.status,
          name: editForm.name,
          phone: editForm.phone,
          address: editForm.address,
          notes: editForm.notes
        });
      }
    } catch (error) {
      console.error('Error updating customer:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  return (
    <AdminLayout>
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
          <Row className="align-items-center">
            <Col>
              <h5 className="mb-0">Customer Management</h5>
            </Col>
            <Col xs="auto">
              <Badge bg="primary" className="me-2">
                Total: {customers.length}
              </Badge>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {/* Filters */}
          <Row className="mb-4 g-3">
            <Col md={8}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by name, email or phone"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <FaFilter />
                </InputGroup.Text>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Customers</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </InputGroup>
            </Col>
          </Row>
          
          {/* Customers Table */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-5">
              <FaUserAlt size={48} className="text-muted mb-3" />
              <h5>No customers found</h5>
              <p className="text-muted">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try changing your search or filter criteria'
                  : 'No customer accounts have been created yet'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(customer => (
                    <tr key={customer.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar bg-primary bg-opacity-10 text-primary rounded-circle p-2 me-2">
                            <FaUserAlt />
                          </div>
                          <div>
                            <div className="fw-medium">{customer.name || 'Unnamed Customer'}</div>
                            <div className="small text-muted">ID: {customer.id.substring(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td>{customer.email || 'N/A'}</td>
                      <td>{customer.phone || 'N/A'}</td>
                      <td>{formatDate(customer.createdAt)}</td>
                      <td>
                        <Badge bg={customer.status === 'active' ? 'success' : 'secondary'}>
                          {customer.status || 'active'}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleViewCustomer(customer)}
                        >
                          <FaEye /> View
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          <FaEdit /> Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Customer Details Modal */}
      <Modal
        show={showCustomerModal}
        onHide={() => setShowCustomerModal(false)}
        size="lg"
      >
        {selectedCustomer && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>Customer Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Row>
                <Col md={6}>
                  <Card className="border-0 bg-light mb-3">
                    <Card.Body>
                      <h6 className="card-subtitle mb-3 text-muted">Personal Information</h6>
                      <div className="mb-2">
                        <strong><FaUserAlt className="me-2" />Name:</strong> {selectedCustomer.name || 'Not provided'}
                      </div>
                      <div className="mb-2">
                        <strong><FaEnvelope className="me-2" />Email:</strong> {selectedCustomer.email || 'Not provided'}
                      </div>
                      <div className="mb-2">
                        <strong><FaPhone className="me-2" />Phone:</strong> {selectedCustomer.phone || 'Not provided'}
                      </div>
                      <div className="mb-2">
                        <strong><FaMapMarkerAlt className="me-2" />Address:</strong> {selectedCustomer.address || 'Not provided'}
                      </div>
                      <div className="mb-2">
                        <strong>Status:</strong> 
                        <Badge bg={selectedCustomer.status === 'active' ? 'success' : 'secondary'} className="ms-2">
                          {selectedCustomer.status || 'active'}
                        </Badge>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="border-0 bg-light mb-3">
                    <Card.Body>
                      <h6 className="card-subtitle mb-3 text-muted">Account Details</h6>
                      <div className="mb-2">
                        <strong>Customer Since:</strong> {formatDate(selectedCustomer.createdAt)}
                      </div>
                      <div className="mb-2">
                        <strong>Last Order:</strong> {customerOrders.length > 0 
                          ? formatDate(customerOrders[0].createdAt) 
                          : 'No orders yet'
                        }
                      </div>
                      <div className="mb-2">
                        <strong>Total Orders:</strong> {customerOrders.length}
                      </div>
                      <div className="mb-2">
                        <strong>Total Spent:</strong> ₹
                        {customerOrders.reduce((total, order) => total + (order.amounts?.total || 0), 0).toFixed(2)}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              {/* Notes Section */}
              <Card className="border-0 bg-light mb-3">
                <Card.Body>
                  <h6 className="card-subtitle mb-3 text-muted">Notes</h6>
                  <p>{selectedCustomer.notes || 'No notes available for this customer.'}</p>
                </Card.Body>
              </Card>
              
              {/* Customer Orders */}
              <h6 className="mt-4 mb-3">Order History</h6>
              {customerOrders.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">This customer has not placed any orders yet.</p>
                </div>
              ) : (
                <Table responsive hover size="sm">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerOrders.map(order => (
                      <tr key={order.id}>
                        <td>#{order.id.substring(0, 8)}</td>
                        <td>{formatDate(order.createdAt)}</td>
                        <td>
                          <Badge bg={
                            order.status === 'delivered' ? 'success' :
                            order.status === 'shipped' ? 'primary' :
                            order.status === 'processing' ? 'info' :
                            order.status === 'cancelled' ? 'danger' :
                            'warning'
                          }>
                            {order.status}
                          </Badge>
                        </td>
                        <td>₹{order.amounts?.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowCustomerModal(false)}>
                Close
              </Button>
              <Button variant="primary" onClick={() => {
                setShowCustomerModal(false);
                handleEditCustomer(selectedCustomer);
              }}>
                Edit Customer
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
      
      {/* Edit Customer Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
      >
        {selectedCustomer && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>Edit Customer</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={editForm.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleInputChange}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleInputChange}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleInputChange}
                    disabled // Email can't be changed as it's the login credential
                  />
                  <Form.Text className="text-muted">
                    Email cannot be changed as it's used for login.
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="address"
                    value={editForm.address}
                    onChange={handleInputChange}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="notes"
                    value={editForm.notes}
                    onChange={handleInputChange}
                    placeholder="Add any notes about this customer"
                  />
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSaveCustomer}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </AdminLayout>
  );
}

export default CustomerManagement;
