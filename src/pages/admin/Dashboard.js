import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Table, Badge, Button, Alert } from 'react-bootstrap';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaUsers, FaBoxOpen, FaRupeeSign, FaExclamationTriangle, FaChartLine, FaBell, FaGift } from 'react-icons/fa';
import AdminLayout from '../../components/AdminLayout';

// Conditionally import Chart.js to handle cases where it's not installed
let Chart;
try {
  Chart = require('chart.js/auto');
} catch (e) {
  console.warn('Chart.js not available. Charts will not be rendered.');
  Chart = null;
}

function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
    lowStockProducts: 0,
    pendingOrders: 0,
    activeDiscounts: 0,
    unreadNotifications: 0
  });
  
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Chart references
  const salesChartRef = useRef(null);
  const salesChartInstance = useRef(null);
  const categoryChartRef = useRef(null);
  const categoryChartInstance = useRef(null);

  useEffect(() => {
    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get total orders and revenue
        const ordersQuery = query(collection(db, 'orders'));
        const ordersSnapshot = await getDocs(ordersQuery);
        
        let totalOrders = 0;
        let totalRevenue = 0;
        let pendingOrders = 0;
        
        ordersSnapshot.forEach(doc => {
          const order = doc.data();
          totalOrders++;
          totalRevenue += order.amounts?.total || 0;
          
          if (order.status === 'pending' || order.status === 'processing') {
            pendingOrders++;
          }
        });
        
        // Get total products and low stock products
        const productsQuery = query(collection(db, 'products'));
        const productsSnapshot = await getDocs(productsQuery);
        
        let totalProducts = 0;
        let lowStockProducts = 0;
        const categories = {};
        
        productsSnapshot.forEach(doc => {
          const product = doc.data();
          totalProducts++;
          
          if (product.stock !== undefined && product.stock < 10) {
            lowStockProducts++;
          }
          
          // Count categories for chart
          if (product.category) {
            categories[product.category] = (categories[product.category] || 0) + 1;
          }
        });
        
        // Get total customers
        const usersQuery = query(
          collection(db, 'users'),
          where('role', '==', 'customer')
        );
        const usersSnapshot = await getDocs(usersQuery);
        const totalCustomers = usersSnapshot.size;
        
        // Get active discounts
        const discountsQuery = query(
          collection(db, 'discounts'),
          where('isActive', '==', true)
        );
        const discountsSnapshot = await getDocs(discountsQuery);
        const activeDiscounts = discountsSnapshot.size;
        
        // Get unread notifications
        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('isActive', '==', true)
        );
        const notificationsSnapshot = await getDocs(notificationsQuery);
        const unreadNotifications = notificationsSnapshot.size;
        
        // Get recent orders
        const recentOrdersQuery = query(
          collection(db, 'orders'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentOrdersSnapshot = await getDocs(recentOrdersQuery);
        
        const recentOrdersData = [];
        recentOrdersSnapshot.forEach(doc => {
          recentOrdersData.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
          });
        });
        
        setRecentOrders(recentOrdersData);
        
        // Update stats
        setStats({
          totalOrders,
          totalRevenue,
          totalProducts,
          totalCustomers,
          lowStockProducts,
          pendingOrders,
          activeDiscounts,
          unreadNotifications
        });
        
        // Initialize charts
        initializeCharts(ordersSnapshot.docs.map(doc => doc.data()), categories);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };
    
    fetchDashboardData();
    
    // Cleanup charts on component unmount
    return () => {
      if (salesChartInstance.current) {
        salesChartInstance.current.destroy();
      }
      if (categoryChartInstance.current) {
        categoryChartInstance.current.destroy();
      }
    };
  }, []);

  // Initialize charts - modified to handle missing Chart.js
  const initializeCharts = (orders, categories) => {
    // If Chart.js is not available, do nothing
    if (!Chart) {
      console.warn('Charts not rendered because Chart.js is not installed');
      return;
    }
    
    // Sales chart - last 6 months
    if (salesChartRef.current) {
      // Prepare monthly data
      const months = [];
      const monthlyRevenue = [];
      const monthlyOrders = [];
      
      // Get last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        months.push(`${monthName} ${year}`);
        
        // Find orders for this month
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        let monthRevenue = 0;
        let monthOrders = 0;
        
        orders.forEach(order => {
          if (!order.createdAt) return;
          
          const orderDate = order.createdAt instanceof Date 
            ? order.createdAt 
            : order.createdAt.toDate();
          
          if (orderDate >= monthStart && orderDate <= monthEnd) {
            monthRevenue += order.amounts?.total || 0;
            monthOrders++;
          }
        });
        
        monthlyRevenue.push(monthRevenue);
        monthlyOrders.push(monthOrders);
      }
      
      // Create sales chart
      if (salesChartInstance.current) {
        salesChartInstance.current.destroy();
      }
      
      const ctx = salesChartRef.current.getContext('2d');
      salesChartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: months,
          datasets: [
            {
              label: 'Revenue (₹)',
              data: monthlyRevenue,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.4,
              yAxisID: 'y',
              fill: true
            },
            {
              label: 'Orders',
              data: monthlyOrders,
              borderColor: 'rgba(54, 162, 235, 1)',
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              tension: 0.4,
              yAxisID: 'y1',
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              position: 'left',
              grid: {
                display: false
              },
              ticks: {
                callback: (value) => '₹' + value.toLocaleString()
              },
              title: {
                display: true,
                text: 'Revenue (₹)'
              }
            },
            y1: {
              beginAtZero: true,
              position: 'right',
              grid: {
                display: false
              },
              title: {
                display: true,
                text: 'Orders'
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Sales Overview - Last 6 Months'
            }
          }
        }
      });
    }
    
    // Category distribution chart
    if (categoryChartRef.current && Object.keys(categories).length > 0) {
      // Prepare category data
      const categoryLabels = Object.keys(categories);
      const categoryData = Object.values(categories);
      const backgroundColors = [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)',
        'rgba(199, 199, 199, 0.7)',
        'rgba(83, 102, 255, 0.7)',
        'rgba(40, 159, 64, 0.7)',
        'rgba(210, 99, 132, 0.7)'
      ];
      
      if (categoryChartInstance.current) {
        categoryChartInstance.current.destroy();
      }
      
      const ctx = categoryChartRef.current.getContext('2d');
      categoryChartInstance.current = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: categoryLabels,
          datasets: [{
            data: categoryData,
            backgroundColor: backgroundColors.slice(0, categoryLabels.length),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                boxWidth: 15
              }
            },
            title: {
              display: true,
              text: 'Product Categories Distribution'
            }
          }
        }
      });
    }
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return '₹' + (amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <AdminLayout>
      {/* Stats Cards */}
      <Row className="mb-4">
        <Col lg={3} sm={6} className="mb-4">
          <Card className="border-0 shadow-sm stat-card h-100 bg-success bg-opacity-10">
            <Card.Body className="d-flex align-items-center">
              <div className="icon-box bg-success bg-opacity-10 text-success rounded p-3 me-3">
                <FaShoppingCart size={24} />
              </div>
              <div>
                <h5 className="text-muted mb-1">Orders</h5>
                <h3 className="mb-0">{stats.totalOrders}</h3>
                <small className="text-success">
                  {stats.pendingOrders} pending
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} sm={6} className="mb-4">
          <Card className="border-0 shadow-sm stat-card h-100 bg-primary bg-opacity-10">
            <Card.Body className="d-flex align-items-center">
              <div className="icon-box bg-primary bg-opacity-10 text-primary rounded p-3 me-3">
                <FaRupeeSign size={24} />
              </div>
              <div>
                <h5 className="text-muted mb-1">Revenue</h5>
                <h3 className="mb-0">{formatCurrency(stats.totalRevenue)}</h3>
                <small className="text-primary">
                  Total earnings
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} sm={6} className="mb-4">
          <Card className="border-0 shadow-sm stat-card h-100 bg-warning bg-opacity-10">
            <Card.Body className="d-flex align-items-center">
              <div className="icon-box bg-warning bg-opacity-10 text-warning rounded p-3 me-3">
                <FaUsers size={24} />
              </div>
              <div>
                <h5 className="text-muted mb-1">Customers</h5>
                <h3 className="mb-0">{stats.totalCustomers}</h3>
                <small className="text-warning">
                  Total registered users
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} sm={6} className="mb-4">
          <Card className="border-0 shadow-sm stat-card h-100 bg-danger bg-opacity-10">
            <Card.Body className="d-flex align-items-center">
              <div className="icon-box bg-danger bg-opacity-10 text-danger rounded p-3 me-3">
                <FaBoxOpen size={24} />
              </div>
              <div>
                <h5 className="text-muted mb-1">Products</h5>
                <h3 className="mb-0">{stats.totalProducts}</h3>
                <small className="text-danger">
                  {stats.lowStockProducts} low stock
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Secondary Stats Row */}
      <Row className="mb-4">
        <Col lg={4} md={4} sm={12} className="mb-4 mb-md-0">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="icon-box bg-info bg-opacity-10 text-info rounded p-3 me-3">
                <FaGift size={24} />
              </div>
              <div>
                <h5 className="text-muted mb-1">Active Discounts</h5>
                <h3 className="mb-0">{stats.activeDiscounts}</h3>
                <small className="text-info">
                  <Link to="/admin/discounts" className="text-decoration-none">Manage discounts</Link>
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4} md={4} sm={12} className="mb-4 mb-md-0">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="icon-box bg-warning bg-opacity-10 text-warning rounded p-3 me-3">
                <FaExclamationTriangle size={24} />
              </div>
              <div>
                <h5 className="text-muted mb-1">Low Stock Products</h5>
                <h3 className="mb-0">{stats.lowStockProducts}</h3>
                <small className="text-warning">
                  <Link to="/admin/products" className="text-decoration-none">Check inventory</Link>
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4} md={4} sm={12} className="mb-4 mb-md-0">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="icon-box bg-primary bg-opacity-10 text-primary rounded p-3 me-3">
                <FaBell size={24} />
              </div>
              <div>
                <h5 className="text-muted mb-1">Notifications</h5>
                <h3 className="mb-0">{stats.unreadNotifications}</h3>
                <small className="text-primary">
                  <Link to="/admin/notifications" className="text-decoration-none">Manage notifications</Link>
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Charts Row */}
      <Row className="mb-4">
        <Col lg={8} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              {!Chart ? (
                <Alert variant="info">
                  <FaChartLine className="me-2" /> 
                  Charts require Chart.js. Please run: <code>npm install chart.js</code>
                </Alert>
              ) : (
                <div style={{ height: '300px' }}>
                  <canvas ref={salesChartRef}></canvas>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              {!Chart ? (
                <Alert variant="info">
                  <FaChartLine className="me-2" /> 
                  Charts require Chart.js. Please run: <code>npm install chart.js</code>
                </Alert>
              ) : (
                <div style={{ height: '300px' }}>
                  <canvas ref={categoryChartRef}></canvas>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Recent Orders Table */}
      <Row>
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center py-3">
              <h5 className="mb-0">Recent Orders</h5>
              <Link to="/admin/orders" className="btn btn-sm btn-primary">
                View All
              </Link>
            </Card.Header>
            <Card.Body>
              <Table responsive hover className="mb-0">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length > 0 ? (
                    recentOrders.map(order => (
                      <tr key={order.id}>
                        <td>#{order.id.substring(0, 8)}</td>
                        <td>
                          {order.shipping?.fullName || 'Unknown Customer'}
                          <div className="small text-muted">
                            {order.shipping?.email || order.userEmail || 'No email'}
                          </div>
                        </td>
                        <td>{formatDate(order.createdAt)}</td>
                        <td>{formatCurrency(order.amounts?.total)}</td>
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
                        <td>
                          <Link to={`/admin/orders?id=${order.id}`} className="btn btn-sm btn-outline-primary">
                            Details
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        No recent orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </AdminLayout>
  );
}

export default Dashboard;
