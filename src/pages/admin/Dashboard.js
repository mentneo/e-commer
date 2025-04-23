import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';

function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    revenue: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get orders stats
        const ordersRef = collection(db, 'orders');
        const ordersSnapshot = await getDocs(ordersRef);
        const totalOrders = ordersSnapshot.size;
        
        let totalRevenue = 0;
        ordersSnapshot.forEach(doc => {
          const orderData = doc.data();
          if (orderData.status === 'completed') {
            totalRevenue += orderData.total || 0;
          }
        });
        
        // Get pending orders
        const pendingOrdersQuery = query(
          collection(db, 'orders'),
          where('status', '==', 'pending')
        );
        const pendingOrdersSnapshot = await getDocs(pendingOrdersQuery);
        const pendingOrders = pendingOrdersSnapshot.size;
        
        // Get recent orders
        const recentOrdersQuery = query(
          collection(db, 'orders'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentOrdersSnapshot = await getDocs(recentOrdersQuery);
        const recentOrdersData = recentOrdersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Get products count
        const productsRef = collection(db, 'products');
        const productsSnapshot = await getDocs(productsRef);
        const totalProducts = productsSnapshot.size;
        
        // Get customers count
        const customersQuery = query(
          collection(db, 'users'),
          where('role', '==', 'customer')
        );
        const customersSnapshot = await getDocs(customersQuery);
        const totalCustomers = customersSnapshot.size;
        
        setStats({
          totalOrders,
          pendingOrders,
          totalProducts,
          totalCustomers,
          revenue: totalRevenue
        });
        
        setRecentOrders(recentOrdersData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <div className="d-flex">
      <AdminSidebar />
      <div className="flex-grow-1">
        <AdminHeader title="Dashboard" />
        <Container fluid className="py-3">
          <Row className="mb-4">
            <Col md={3}>
              <Card className="shadow-sm">
                <Card.Body>
                  <h5>Total Orders</h5>
                  <h3>{loading ? '...' : stats.totalOrders}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="shadow-sm">
                <Card.Body>
                  <h5>Pending Orders</h5>
                  <h3>{loading ? '...' : stats.pendingOrders}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="shadow-sm">
                <Card.Body>
                  <h5>Total Products</h5>
                  <h3>{loading ? '...' : stats.totalProducts}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="shadow-sm">
                <Card.Body>
                  <h5>Revenue</h5>
                  <h3>₹{loading ? '...' : stats.revenue.toFixed(2)}</h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row>
            <Col md={12}>
              <Card className="shadow-sm">
                <Card.Header>
                  <h5 className="mb-0">Recent Orders</h5>
                </Card.Header>
                <Card.Body>
                  {loading ? (
                    <p>Loading recent orders...</p>
                  ) : recentOrders.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Total</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentOrders.map(order => (
                            <tr key={order.id}>
                              <td>{order.id.substring(0, 8)}</td>
                              <td>{order.customerName || 'N/A'}</td>
                              <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                              <td>₹{order.total?.toFixed(2) || '0.00'}</td>
                              <td>
                                <span className={`badge bg-${
                                  order.status === 'completed' ? 'success' : 
                                  order.status === 'pending' ? 'warning' : 
                                  order.status === 'cancelled' ? 'danger' : 'secondary'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p>No recent orders found.</p>
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

export default Dashboard;
