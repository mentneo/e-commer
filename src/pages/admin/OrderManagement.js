import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Button, Modal } from 'react-bootstrap';
import { collection, doc, getDocs, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-toastify';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';

function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [customerDetails, setCustomerDetails] = useState(null);

  // Fetch orders
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const ordersRef = collection(db, 'orders');
      const ordersSnapshot = await getDocs(ordersRef);
      const ordersList = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort orders by date (newest first)
      ordersList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setOrders(ordersList);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      toast.success(`Order ${orderId.substring(0, 8)} status updated to ${newStatus}`);
      
      // Update local state
      setOrders(prevOrders => prevOrders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      // Close modal if open
      if (showModal && selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    }
  };

  // View order details
  const viewOrderDetails = async (order) => {
    setSelectedOrder(order);
    
    // Fetch customer details if userId exists
    if (order.userId) {
      try {
        const userRef = doc(db, 'users', order.userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setCustomerDetails(userSnap.data());
        } else {
          setCustomerDetails(null);
        }
      } catch (error) {
        console.error("Error fetching customer details:", error);
        setCustomerDetails(null);
      }
    } else {
      setCustomerDetails(null);
    }
    
    setShowModal(true);
  };

  // Get badge color based on status
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'shipped':
        return 'primary';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="d-flex">
      <AdminSidebar />
      <div className="flex-grow-1">
        <AdminHeader title="Order Management" />
        <Container fluid className="py-3">
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">Orders</h5>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <p>Loading orders...</p>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Payment</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length > 0 ? (
                        orders.map(order => (
                          <tr key={order.id}>
                            <td>{order.id.substring(0, 8)}</td>
                            <td>{order.customerName || 'Guest'}</td>
                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td>₹{order.total?.toFixed(2)}</td>
                            <td>{order.paymentMethod}</td>
                            <td>
                              <Badge bg={getStatusBadge(order.status)}>
                                {order.status}
                              </Badge>
                            </td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="me-2"
                                onClick={() => viewOrderDetails(order)}
                              >
                                View
                              </Button>
                              
                              {order.status === 'pending' && (
                                <>
                                  <Button 
                                    variant="outline-success" 
                                    size="sm" 
                                    className="me-2"
                                    onClick={() => updateOrderStatus(order.id, 'processing')}
                                  >
                                    Confirm
                                  </Button>
                                  <Button 
                                    variant="outline-danger" 
                                    size="sm"
                                    onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              
                              {order.status === 'processing' && (
                                <Button 
                                  variant="outline-info" 
                                  size="sm"
                                  onClick={() => updateOrderStatus(order.id, 'shipped')}
                                >
                                  Ship
                                </Button>
                              )}
                              
                              {order.status === 'shipped' && (
                                <Button 
                                  variant="outline-success" 
                                  size="sm"
                                  onClick={() => updateOrderStatus(order.id, 'delivered')}
                                >
                                  Mark Delivered
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center">No orders found</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>
        
        {/* Order Details Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Order #{selectedOrder?.id.substring(0, 8)}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedOrder && (
              <>
                <div className="mb-4">
                  <h5>Order Information</h5>
                  <Table bordered>
                    <tbody>
                      <tr>
                        <td width="30%"><strong>Order Date</strong></td>
                        <td>{new Date(selectedOrder.createdAt).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td><strong>Status</strong></td>
                        <td>
                          <Badge bg={getStatusBadge(selectedOrder.status)}>
                            {selectedOrder.status}
                          </Badge>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Payment Method</strong></td>
                        <td>{selectedOrder.paymentMethod}</td>
                      </tr>
                      <tr>
                        <td><strong>Transaction ID</strong></td>
                        <td>{selectedOrder.transactionId || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
                
                <div className="mb-4">
                  <h5>Customer Information</h5>
                  <Table bordered>
                    <tbody>
                      <tr>
                        <td width="30%"><strong>Name</strong></td>
                        <td>{selectedOrder.customerName || customerDetails?.displayName || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>Email</strong></td>
                        <td>{selectedOrder.customerEmail || customerDetails?.email || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>Phone</strong></td>
                        <td>{selectedOrder.customerPhone || customerDetails?.phoneNumber || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
                
                <div className="mb-4">
                  <h5>Shipping Address</h5>
                  <p>
                    {selectedOrder.address?.street}<br />
                    {selectedOrder.address?.city}, {selectedOrder.address?.state} {selectedOrder.address?.pincode}<br />
                    {selectedOrder.address?.country}
                  </p>
                </div>
                
                <div className="mb-4">
                  <h5>Order Items</h5>
                  <Table bordered>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.name}</td>
                          <td>₹{item.price?.toFixed(2)}</td>
                          <td>{item.quantity}</td>
                          <td>₹{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan="3" className="text-end"><strong>Subtotal</strong></td>
                        <td>₹{selectedOrder.subtotal?.toFixed(2)}</td>
                      </tr>
                      {selectedOrder.discount > 0 && (
                        <tr>
                          <td colSpan="3" className="text-end"><strong>Discount</strong></td>
                          <td>-₹{selectedOrder.discount?.toFixed(2)}</td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan="3" className="text-end"><strong>Shipping</strong></td>
                        <td>₹{selectedOrder.shipping?.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="text-end"><strong>Total</strong></td>
                        <td>₹{selectedOrder.total?.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            {selectedOrder && (
              <>
                {selectedOrder.status === 'pending' && (
                  <>
                    <Button 
                      variant="success" 
                      onClick={() => updateOrderStatus(selectedOrder.id, 'processing')}
                    >
                      Confirm Order
                    </Button>
                    <Button 
                      variant="danger"
                      onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                    >
                      Reject Order
                    </Button>
                  </>
                )}
                
                {selectedOrder.status === 'processing' && (
                  <Button 
                    variant="primary"
                    onClick={() => updateOrderStatus(selectedOrder.id, 'shipped')}
                  >
                    Mark as Shipped
                  </Button>
                )}
                
                {selectedOrder.status === 'shipped' && (
                  <Button 
                    variant="success"
                    onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                  >
                    Mark as Delivered
                  </Button>
                )}
              </>
            )}
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
}

export default OrderManagement;
