import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Form, InputGroup, Spinner } from 'react-bootstrap';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaSearch, FaEnvelope, FaPhone } from 'react-icons/fa';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';

function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalOrders, setTotalOrders] = useState({});
  const [totalSpent, setTotalSpent] = useState({});
  
  useEffect(() => {
    fetchCustomers();
  }, []);
  
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      // Fetch customers
      const customersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'customer'),
        orderBy('createdAt', 'desc')
      );
      
      const customersSnapshot = await getDocs(customersQuery);
      const customersData = customersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? new Date(doc.data().createdAt).toLocaleString() : 'N/A'
      }));
      
      setCustomers(customersData);
      
      // Fetch orders for each customer
      const ordersRef = collection(db, 'orders');
      const ordersSnapshot = await getDocs(ordersRef);
      
      const ordersByCustomer = {};
      const spentByCustomer = {};
      
      ordersSnapshot.forEach(doc => {
        const order = doc.data();
        if (order.userId) {
          // Count orders by customer
          if (!ordersByCustomer[order.userId]) {
            ordersByCustomer[order.userId] = 0;
          }
          ordersByCustomer[order.userId]++;
          
          // Sum total spent by customer
          if (!spentByCustomer[order.userId]) {
            spentByCustomer[order.userId] = 0;
          }
          if (order.total && order.status !== 'cancelled') {
            spentByCustomer[order.userId] += order.total;
          }
        }
      });
      
      setTotalOrders(ordersByCustomer);
      setTotalSpent(spentByCustomer);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => {
    const search = searchTerm.toLowerCase();
    return (
      (customer.displayName && customer.displayName.toLowerCase().includes(search)) ||
      (customer.email && customer.email.toLowerCase().includes(search)) ||
      (customer.phoneNumber && customer.phoneNumber.includes(search))
    );
  });
  
  // Get customer status badge
  const getCustomerBadge = (customer) => {
    const orderCount = totalOrders[customer.id] || 0;
    const spent = totalSpent[customer.id] || 0;
    
    if (spent > 5000) return { label: 'VIP', color: 'danger' };
    if (spent > 2000) return { label: 'Loyal', color: 'success' };
    if (orderCount > 0) return { label: 'Active', color: 'primary' };
    return { label: 'New', color: 'secondary' };
  };
  
  return (
    <div className="d-flex">
      <AdminSidebar />
      <div className="flex-grow-1">
        <AdminHeader title="Customer Management" />
        <Container fluid className="py-3">
          <Card className="shadow-sm">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Customers</h5>
                <Form>
                  <InputGroup>
                    <Form.Control
                      placeholder="Search customers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button variant="outline-secondary">
                      <FaSearch />
                    </Button>
                  </InputGroup>
                </Form>
              </div>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3">Loading customers...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Contact</th>
                        <th>Joined</th>
                        <th>Orders</th>
                        <th>Total Spent</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map(customer => {
                          const badgeInfo = getCustomerBadge(customer);
                          const orderCount = totalOrders[customer.id] || 0;
                          const spent = totalSpent[customer.id] || 0;
                          
                          return (
                            <tr key={customer.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <img 
                                    src={`https://ui-avatars.com/api/?name=${customer.displayName || 'User'}&background=random`} 
                                    alt={customer.displayName}
                                    className="rounded-circle me-2"
                                    style={{ width: '40px', height: '40px' }}
                                  />
                                  <div>
                                    <div>{customer.displayName || 'No Name'}</div>
                                    <small className="text-muted">{customer.id.substring(0, 8)}</small>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div>
                                  {customer.email && (
                                    <div>
                                      <FaEnvelope className="me-1 text-muted" /> {customer.email}
                                    </div>
                                  )}
                                  {customer.phoneNumber && (
                                    <div>
                                      <FaPhone className="me-1 text-muted" /> {customer.phoneNumber}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>{customer.createdAt}</td>
                              <td>{orderCount}</td>
                              <td>
                                {spent > 0 ? `₹${spent.toFixed(2)}` : '₹0.00'}
                              </td>
                              <td>
                                <Badge bg={badgeInfo.color}>
                                  {badgeInfo.label}
                                </Badge>
                              </td>
                              <td>
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  className="me-2"
                                  disabled={orderCount === 0}
                                >
                                  View Orders
                                </Button>
                                <Button 
                                  variant="outline-secondary" 
                                  size="sm"
                                >
                                  Details
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center">
                            {searchTerm ? 'No customers match your search' : 'No customers found'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>
    </div>
  );
}

export default CustomerManagement;
