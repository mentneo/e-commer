import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, Modal, Alert } from 'react-bootstrap';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaTruck, FaEdit, FaEye } from 'react-icons/fa';

function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState({
    status: '',
    partnerName: '',
    agentPhone: '',
    trackingId: '',
    trackingUrl: '',
    expectedDelivery: ''
  });

  // Status colors mapping
  const statusColors = {
    'pending': 'warning',
    'processing': 'info',
    'shipped': 'primary',
    'delivered': 'success',
    'cancelled': 'danger'
  };

  // Status options
  const statusOptions = [
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled'
  ];

  // Format the order date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Fetch orders from Firestore
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const ordersData = [];
        querySnapshot.forEach((doc) => {
          ordersData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setOrders(ordersData);
        setError(null);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);

  // Handle order view
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  // Handle order status change
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setLoading(true);
      
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      // If status changed to delivered, also update payment status for COD
      const order = orders.find(o => o.id === orderId);
      if (newStatus === 'delivered' && order.payment.method === 'cod') {
        await updateDoc(doc(db, 'orders', orderId), {
          'payment.status': 'completed'
        });
      }
      
      setError(null);
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle delivery info
  const handleAddDeliveryInfo = (order) => {
    setSelectedOrder(order);
    
    // Pre-fill with existing delivery info if available
    if (order.delivery) {
      setDeliveryInfo({
        status: order.status || 'shipped',
        partnerName: order.delivery.partnerName || '',
        agentPhone: order.delivery.agentPhone || '',
        trackingId: order.delivery.trackingId || '',
        trackingUrl: order.delivery.trackingUrl || '',
        expectedDelivery: order.delivery.expectedDelivery 
          ? new Date(order.delivery.expectedDelivery).toISOString().split('T')[0]
          : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    } else {
      // Default values
      setDeliveryInfo({
        status: 'shipped',
        partnerName: '',
        agentPhone: '',
        trackingId: '',
        trackingUrl: '',
        expectedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }
    
    setShowDeliveryModal(true);
  };

  // Handle delivery info input changes
  const handleDeliveryInfoChange = (e) => {
    const { name, value } = e.target;
    setDeliveryInfo({
      ...deliveryInfo,
      [name]: value
    });
  };

  // Save delivery information
  const handleSaveDeliveryInfo = async () => {
    try {
      setLoading(true);
      
      // Update the order with delivery information
      await updateDoc(doc(db, 'orders', selectedOrder.id), {
        status: deliveryInfo.status,
        delivery: {
          partnerName: deliveryInfo.partnerName,
          agentPhone: deliveryInfo.agentPhone,
          trackingId: deliveryInfo.trackingId,
          trackingUrl: deliveryInfo.trackingUrl,
          expectedDelivery: new Date(deliveryInfo.expectedDelivery).toISOString(),
          updatedAt: new Date().toISOString()
        },
        updatedAt: new Date()
      });
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === selectedOrder.id 
          ? { 
              ...order, 
              status: deliveryInfo.status,
              delivery: {
                partnerName: deliveryInfo.partnerName,
                agentPhone: deliveryInfo.agentPhone,
                trackingId: deliveryInfo.trackingId,
                trackingUrl: deliveryInfo.trackingUrl,
                expectedDelivery: new Date(deliveryInfo.expectedDelivery),
                updatedAt: new Date()
              }
            } 
          : order
      ));
      
      setShowDeliveryModal(false);
      setError(null);
    } catch (err) {
      console.error('Error updating delivery info:', err);
      setError('Failed to update delivery information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">Order Management</h4>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          {loading && <div className="text-center py-4">Loading orders...</div>}
          
          {!loading && orders.length === 0 ? (
            <div className="text-center py-4">
              <p>No orders found.</p>
            </div>
          ) : (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>#{order.id.substring(0, 8)}</td>
                    <td>{order.shipping?.fullName || 'Unknown'}</td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>₹{order.amounts?.total.toFixed(2) || '0.00'}</td>
                    <td>
                      <Badge bg={statusColors[order.status] || 'secondary'}>
                        {order.status}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={order.payment?.status === 'completed' ? 'success' : 'warning'}>
                        {order.payment?.status || 'unknown'}
                      </Badge>
                      <div className="small text-muted">
                        {order.payment?.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => handleViewOrder(order)}
                        >
                          <FaEye /> View
                        </Button>
                        
                        {['pending', 'processing'].includes(order.status) && (
                          <Button 
                            variant="outline-success" 
                            size="sm"
                            onClick={() => handleAddDeliveryInfo(order)}
                          >
                            <FaTruck /> Ship
                          </Button>
                        )}
                        
                        {order.status === 'shipped' && (
                          <Button 
                            variant="outline-info" 
                            size="sm"
                            onClick={() => handleAddDeliveryInfo(order)}
                          >
                            <FaEdit /> Update
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      
      {/* Order Details Modal */}
      <Modal
        show={showOrderModal}
        onHide={() => setShowOrderModal(false)}
        size="lg"
      >
        {selectedOrder && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>Order #{selectedOrder.id.substring(0, 8)}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Row className="mb-3">
                <Col md={6}>
                  <h6>Customer Information</h6>
                  <p><strong>Name:</strong> {selectedOrder.shipping?.fullName}</p>
                  <p><strong>Email:</strong> {selectedOrder.shipping?.email}</p>
                  <p><strong>Phone:</strong> {selectedOrder.shipping?.phone}</p>
                </Col>
                <Col md={6}>
                  <h6>Shipping Address</h6>
                  <p>{selectedOrder.shipping?.address}</p>
                  <p>{selectedOrder.shipping?.city}, {selectedOrder.shipping?.state}</p>
                  <p>{selectedOrder.shipping?.postalCode}</p>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={6}>
                  <h6>Order Details</h6>
                  <p><strong>Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
                  <p>
                    <strong>Status:</strong> 
                    <Form.Select 
                      size="sm" 
                      className="d-inline-block ms-2"
                      style={{ width: '130px' }}
                      value={selectedOrder.status}
                      onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </Form.Select>
                  </p>
                </Col>
                <Col md={6}>
                  <h6>Payment Information</h6>
                  <p>
                    <strong>Method:</strong> {selectedOrder.payment?.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                  </p>
                  <p>
                    <strong>Status:</strong> 
                    <Badge 
                      bg={selectedOrder.payment?.status === 'completed' ? 'success' : 'warning'}
                      className="ms-2"
                    >
                      {selectedOrder.payment?.status}
                    </Badge>
                  </p>
                </Col>
              </Row>
              
              {/* Delivery Information */}
              {selectedOrder.delivery && (
                <Row className="mb-3">
                  <Col xs={12}>
                    <Card className="border-primary">
                      <Card.Header className="bg-primary text-white">
                        <h6 className="mb-0">Delivery Information</h6>
                      </Card.Header>
                      <Card.Body>
                        <Row>
                          <Col md={6}>
                            <p><strong>Delivery Partner:</strong> {selectedOrder.delivery.partnerName}</p>
                            <p><strong>Agent Phone:</strong> {selectedOrder.delivery.agentPhone}</p>
                          </Col>
                          <Col md={6}>
                            <p><strong>Tracking ID:</strong> {selectedOrder.delivery.trackingId}</p>
                            <p>
                              <strong>Expected Delivery:</strong> {formatDate(selectedOrder.delivery.expectedDelivery)}
                            </p>
                          </Col>
                        </Row>
                        {selectedOrder.delivery.trackingUrl && (
                          <div className="mt-2">
                            <a 
                              href={selectedOrder.delivery.trackingUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary"
                            >
                              <FaTruck className="me-2" /> Track Package
                            </a>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}
              
              <h6>Order Items</h6>
              <Table responsive striped size="sm">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div className="d-flex align-items-center">
                          {item.image && (
                            <img 
                              src={item.image} 
                              alt={item.name}
                              width="40"
                              height="40"
                              className="me-2 rounded"
                            />
                          )}
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td>₹{item.price.toFixed(2)}</td>
                      <td>{item.quantity}</td>
                      <td className="text-end">₹{(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="text-end"><strong>Subtotal:</strong></td>
                    <td className="text-end">₹{selectedOrder.amounts.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="text-end"><strong>Shipping:</strong></td>
                    <td className="text-end">₹{selectedOrder.amounts.shipping.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="text-end"><strong>Tax:</strong></td>
                    <td className="text-end">₹{selectedOrder.amounts.tax.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                    <td className="text-end fw-bold">₹{selectedOrder.amounts.total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </Table>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowOrderModal(false)}>
                Close
              </Button>
              {['pending', 'processing', 'shipped'].includes(selectedOrder.status) && (
                <Button variant="primary" onClick={() => {
                  setShowOrderModal(false);
                  handleAddDeliveryInfo(selectedOrder);
                }}>
                  {selectedOrder.delivery ? 'Update Delivery Info' : 'Add Delivery Info'}
                </Button>
              )}
            </Modal.Footer>
          </>
        )}
      </Modal>
      
      {/* Delivery Information Modal */}
      <Modal
        show={showDeliveryModal}
        onHide={() => setShowDeliveryModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedOrder && 
              <>Shipping Details - Order #{selectedOrder.id.substring(0, 8)}</>
            }
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Order Status</Form.Label>
              <Form.Select
                name="status"
                value={deliveryInfo.status}
                onChange={handleDeliveryInfoChange}
              >
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Delivery Partner</Form.Label>
              <Form.Control
                type="text"
                name="partnerName"
                value={deliveryInfo.partnerName}
                onChange={handleDeliveryInfoChange}
                placeholder="e.g., FedEx, DHL, etc."
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Delivery Agent Phone</Form.Label>
              <Form.Control
                type="tel"
                name="agentPhone"
                value={deliveryInfo.agentPhone}
                onChange={handleDeliveryInfoChange}
                placeholder="Delivery agent's contact number"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Tracking ID</Form.Label>
              <Form.Control
                type="text"
                name="trackingId"
                value={deliveryInfo.trackingId}
                onChange={handleDeliveryInfoChange}
                placeholder="Shipment tracking number"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Tracking URL (Optional)</Form.Label>
              <Form.Control
                type="url"
                name="trackingUrl"
                value={deliveryInfo.trackingUrl}
                onChange={handleDeliveryInfoChange}
                placeholder="https://example.com/track/123456"
              />
              <Form.Text className="text-muted">
                Link where customer can track their package
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Expected Delivery Date</Form.Label>
              <Form.Control
                type="date"
                name="expectedDelivery"
                value={deliveryInfo.expectedDelivery}
                onChange={handleDeliveryInfoChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeliveryModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveDeliveryInfo}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Delivery Information'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default OrderManagement;
