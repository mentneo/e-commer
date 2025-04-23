import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Table, Button, Form, Alert, Modal, Row, Col, Badge, InputGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaPlus, FaEdit, FaTrash, FaInfoCircle, FaCopy, FaCheck, FaGift, FaUsers, FaShoppingCart, FaPercent, FaRupeeSign, FaChartLine } from 'react-icons/fa';

// Conditionally import Chart.js to handle cases where it's not installed
let Chart;
try {
  Chart = require('chart.js/auto');
} catch (e) {
  console.warn('Chart.js not available. Charts will not be rendered.');
  Chart = null;
}

function DiscountManagement() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDiscount, setCurrentDiscount] = useState({
    code: '',
    type: 'percentage',
    value: '',
    minOrderAmount: '',
    maxDiscount: '',
    usageLimit: '',
    usedCount: 0,
    startDate: '',
    endDate: '',
    description: '',
    isActive: true,
    applicableProducts: [],
    excludedProducts: []
  });
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [couponCopied, setCouponCopied] = useState(false);
  const [stats, setStats] = useState({
    activeDiscounts: 0,
    expiredDiscounts: 0,
    totalUsage: 0,
    totalSavings: 0
  });
  
  // Chart references
  const usageChartRef = useRef(null);
  const usageChartInstance = useRef(null);
  const typeChartRef = useRef(null);
  const typeChartInstance = useRef(null);

  // Fetch discounts and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch discounts
        const discountsQuery = query(collection(db, 'discounts'));
        const discountsSnapshot = await getDocs(discountsQuery);
        
        const discountsData = [];
        let activeCount = 0;
        let expiredCount = 0;
        let totalUsage = 0;
        let totalSavings = 0;
        
        discountsSnapshot.forEach((doc) => {
          const discount = { id: doc.id, ...doc.data() };
          
          // Calculate expiry status
          const now = new Date();
          const endDate = discount.endDate ? new Date(discount.endDate) : null;
          const isExpired = endDate && endDate < now;
          
          if (isExpired) {
            expiredCount++;
          } else if (discount.isActive) {
            activeCount++;
          }
          
          totalUsage += discount.usedCount || 0;
          totalSavings += discount.totalSavings || 0;
          
          discountsData.push(discount);
        });
        
        setDiscounts(discountsData);
        setStats({
          activeDiscounts: activeCount,
          expiredDiscounts: expiredCount,
          totalUsage,
          totalSavings
        });
        
        // Fetch products for the product selector
        const productsQuery = query(collection(db, 'products'));
        const productsSnapshot = await getDocs(productsQuery);
        
        const productsData = [];
        productsSnapshot.forEach((doc) => {
          productsData.push({ id: doc.id, ...doc.data() });
        });
        
        setProducts(productsData);
        setError(null);
        
        // Initialize charts
        initializeCharts(discountsData);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load discounts. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Cleanup charts on component unmount
    return () => {
      if (usageChartInstance.current) {
        usageChartInstance.current.destroy();
      }
      if (typeChartInstance.current) {
        typeChartInstance.current.destroy();
      }
    };
  }, []);

  // Initialize charts - modified to handle missing Chart.js
  const initializeCharts = (discountsData) => {
    // If Chart.js is not available, do nothing
    if (!Chart) {
      console.warn('Charts not rendered because Chart.js is not installed');
      return;
    }
    
    if (usageChartRef.current) {
      // Prepare data for usage chart (top 5 most used coupons)
      const sortedByUsage = [...discountsData].sort((a, b) => (b.usedCount || 0) - (a.usedCount || 0)).slice(0, 5);
      
      if (usageChartInstance.current) {
        usageChartInstance.current.destroy();
      }
      
      const ctx = usageChartRef.current.getContext('2d');
      usageChartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: sortedByUsage.map(d => d.code),
          datasets: [{
            label: 'Usage Count',
            data: sortedByUsage.map(d => d.usedCount || 0),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'Most Used Discount Codes'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Usage Count'
              },
              ticks: {
                precision: 0
              }
            }
          }
        }
      });
    }
    
    if (typeChartRef.current) {
      // Prepare data for discount type distribution
      const typeCounts = {
        percentage: discountsData.filter(d => d.type === 'percentage').length,
        fixed: discountsData.filter(d => d.type === 'fixed').length
      };
      
      if (typeChartInstance.current) {
        typeChartInstance.current.destroy();
      }
      
      const ctx = typeChartRef.current.getContext('2d');
      typeChartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Percentage Discounts', 'Fixed Amount Discounts'],
          datasets: [{
            data: [typeCounts.percentage, typeCounts.fixed],
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(75, 192, 192, 0.6)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(75, 192, 192, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            },
            title: {
              display: true,
              text: 'Discount Types Distribution'
            }
          }
        }
      });
    }
  };

  // Generate random coupon code
  const generateCouponCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setCurrentDiscount(prev => ({ ...prev, code: result }));
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentDiscount(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Open modal for adding new discount
  const handleAddDiscount = () => {
    // Set default dates
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    setCurrentDiscount({
      code: '',
      type: 'percentage',
      value: '',
      minOrderAmount: '',
      maxDiscount: '',
      usageLimit: '',
      usedCount: 0,
      startDate: today.toISOString().split('T')[0],
      endDate: nextMonth.toISOString().split('T')[0],
      description: '',
      isActive: true,
      applicableProducts: [],
      excludedProducts: []
    });
    
    setIsEditing(false);
    setShowModal(true);
  };

  // Open modal for editing discount
  const handleEditDiscount = (discount) => {
    // Format dates for the date inputs
    const startDate = discount.startDate ? new Date(discount.startDate).toISOString().split('T')[0] : '';
    const endDate = discount.endDate ? new Date(discount.endDate).toISOString().split('T')[0] : '';
    
    setCurrentDiscount({
      ...discount,
      startDate,
      endDate
    });
    
    setIsEditing(true);
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate form
      if (!currentDiscount.code || !currentDiscount.value || !currentDiscount.startDate) {
        setError('Please fill all required fields');
        setLoading(false);
        return;
      }
      
      // Convert dates to timestamps
      const startDate = new Date(currentDiscount.startDate);
      const endDate = currentDiscount.endDate ? new Date(currentDiscount.endDate) : null;
      
      // Prepare discount data
      const discountData = {
        code: currentDiscount.code.toUpperCase(),
        type: currentDiscount.type,
        value: parseFloat(currentDiscount.value),
        minOrderAmount: currentDiscount.minOrderAmount ? parseFloat(currentDiscount.minOrderAmount) : 0,
        maxDiscount: currentDiscount.maxDiscount ? parseFloat(currentDiscount.maxDiscount) : null,
        usageLimit: currentDiscount.usageLimit ? parseInt(currentDiscount.usageLimit) : null,
        startDate: startDate,
        endDate: endDate,
        description: currentDiscount.description,
        isActive: currentDiscount.isActive,
        applicableProducts: currentDiscount.applicableProducts || [],
        excludedProducts: currentDiscount.excludedProducts || [],
        updatedAt: new Date()
      };
      
      if (isEditing) {
        // Update existing discount
        await updateDoc(doc(db, 'discounts', currentDiscount.id), discountData);
        
        // Update local state
        setDiscounts(prev => 
          prev.map(item => 
            item.id === currentDiscount.id ? { ...item, ...discountData } : item
          )
        );
      } else {
        // Add new discount
        const newDiscountData = {
          ...discountData,
          usedCount: 0,
          totalSavings: 0,
          createdAt: new Date()
        };
        
        const docRef = await addDoc(collection(db, 'discounts'), newDiscountData);
        
        // Update local state
        setDiscounts(prev => [
          { id: docRef.id, ...newDiscountData },
          ...prev
        ]);
      }
      
      // Close modal and update statistics
      setShowModal(false);
      updateStats();
      setError(null);
    } catch (err) {
      console.error('Error saving discount:', err);
      setError('Failed to save discount. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update statistics
  const updateStats = () => {
    const now = new Date();
    let activeCount = 0;
    let expiredCount = 0;
    let totalUsage = 0;
    let totalSavings = 0;
    
    discounts.forEach(discount => {
      const endDate = discount.endDate ? new Date(discount.endDate) : null;
      const isExpired = endDate && endDate < now;
      
      if (isExpired) {
        expiredCount++;
      } else if (discount.isActive) {
        activeCount++;
      }
      
      totalUsage += discount.usedCount || 0;
      totalSavings += discount.totalSavings || 0;
    });
    
    setStats({
      activeDiscounts: activeCount,
      expiredDiscounts: expiredCount,
      totalUsage,
      totalSavings
    });
    
    // Update charts
    initializeCharts(discounts);
  };

  // Delete a discount
  const handleDeleteDiscount = async (id) => {
    if (window.confirm('Are you sure you want to delete this discount code?')) {
      try {
        setLoading(true);
        await deleteDoc(doc(db, 'discounts', id));
        
        // Update local state
        setDiscounts(prev => prev.filter(item => item.id !== id));
        updateStats();
        setError(null);
      } catch (err) {
        console.error('Error deleting discount:', err);
        setError('Failed to delete discount. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Toggle discount active status
  const handleToggleActive = async (discount) => {
    try {
      setLoading(true);
      
      await updateDoc(doc(db, 'discounts', discount.id), {
        isActive: !discount.isActive,
        updatedAt: new Date()
      });
      
      // Update local state
      setDiscounts(prev => 
        prev.map(item => 
          item.id === discount.id 
            ? { ...item, isActive: !item.isActive } 
            : item
        )
      );
      
      updateStats();
      setError(null);
    } catch (err) {
      console.error('Error updating discount status:', err);
      setError('Failed to update discount status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Copy coupon code to clipboard
  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCouponCopied(code);
        setTimeout(() => setCouponCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy code:', err);
      });
  };

  // Check if discount is expired
  const isDiscountExpired = (discount) => {
    if (!discount.endDate) return false;
    const now = new Date();
    const endDate = new Date(discount.endDate);
    return endDate < now;
  };

  // Toggle product selection for applicable/excluded products
  const toggleProductSelection = (productId, type) => {
    setCurrentDiscount(prev => {
      if (type === 'applicable') {
        const applicableProducts = prev.applicableProducts || [];
        
        if (applicableProducts.includes(productId)) {
          return {
            ...prev,
            applicableProducts: applicableProducts.filter(id => id !== productId)
          };
        } else {
          return {
            ...prev,
            applicableProducts: [...applicableProducts, productId],
            excludedProducts: (prev.excludedProducts || []).filter(id => id !== productId)
          };
        }
      } else {
        const excludedProducts = prev.excludedProducts || [];
        
        if (excludedProducts.includes(productId)) {
          return {
            ...prev,
            excludedProducts: excludedProducts.filter(id => id !== productId)
          };
        } else {
          return {
            ...prev,
            excludedProducts: [...excludedProducts, productId],
            applicableProducts: (prev.applicableProducts || []).filter(id => id !== productId)
          };
        }
      }
    });
  };

  return (
    <Container className="py-4">
      {/* Stats Dashboard */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center mb-3">
            <Card.Body className="bg-success bg-opacity-10">
              <FaGift className="mb-2" size={24} color="#198754" />
              <h3>{stats.activeDiscounts}</h3>
              <p className="mb-0 text-success">Active Discounts</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center mb-3">
            <Card.Body className="bg-danger bg-opacity-10">
              <FaPercent className="mb-2" size={24} color="#dc3545" />
              <h3>{stats.expiredDiscounts}</h3>
              <p className="mb-0 text-danger">Expired Discounts</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center mb-3">
            <Card.Body className="bg-primary bg-opacity-10">
              <FaUsers className="mb-2" size={24} color="#0d6efd" />
              <h3>{stats.totalUsage}</h3>
              <p className="mb-0 text-primary">Total Redemptions</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center mb-3">
            <Card.Body className="bg-warning bg-opacity-10">
              <FaRupeeSign className="mb-2" size={24} color="#ffc107" />
              <h3>₹{stats.totalSavings.toFixed(2)}</h3>
              <p className="mb-0 text-warning">Total Savings</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Charts Row */}
      <Row className="mb-4">
        <Col md={7}>
          <Card>
            <Card.Body>
              {!Chart ? (
                <Alert variant="info">
                  <FaChartLine className="me-2" /> 
                  Charts require Chart.js. Please run: <code>npm install chart.js</code>
                </Alert>
              ) : (
                <canvas ref={usageChartRef} height="200"></canvas>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={5}>
          <Card>
            <Card.Body>
              {!Chart ? (
                <Alert variant="info">
                  <FaChartLine className="me-2" /> 
                  Charts require Chart.js. Please run: <code>npm install chart.js</code>
                </Alert>
              ) : (
                <canvas ref={typeChartRef} height="200"></canvas>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Discounts Table */}
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Discount Codes</h4>
          <Button 
            variant="light" 
            onClick={handleAddDiscount}
          >
            <FaPlus className="me-2" /> Create Discount
          </Button>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          {loading && <div className="text-center py-4">Loading discount codes...</div>}
          
          <Table responsive hover>
            <thead>
              <tr>
                <th>Code</th>
                <th>Value</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Usage</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {discounts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    No discount codes found. Create your first discount!
                  </td>
                </tr>
              ) : (
                discounts.map(discount => (
                  <tr key={discount.id} className={isDiscountExpired(discount) ? 'table-danger' : ''}>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className="fw-bold me-2">{discount.code}</span>
                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Tooltip id={`tooltip-${discount.id}`}>
                              {couponCopied === discount.code ? 'Copied!' : 'Copy to clipboard'}
                            </Tooltip>
                          }
                        >
                          <Button 
                            variant="link" 
                            className="p-0 text-primary"
                            onClick={() => copyToClipboard(discount.code)}
                          >
                            {couponCopied === discount.code ? <FaCheck /> : <FaCopy />}
                          </Button>
                        </OverlayTrigger>
                      </div>
                      <small className="text-muted d-block">{discount.description}</small>
                    </td>
                    <td>
                      {discount.type === 'percentage' ? 
                        `${discount.value}%` : 
                        `₹${discount.value}`
                      }
                      {discount.maxDiscount && discount.type === 'percentage' && (
                        <small className="text-muted d-block">
                          Max: ₹{discount.maxDiscount}
                        </small>
                      )}
                      {discount.minOrderAmount > 0 && (
                        <small className="text-muted d-block">
                          Min order: ₹{discount.minOrderAmount}
                        </small>
                      )}
                    </td>
                    <td>{new Date(discount.startDate).toLocaleDateString()}</td>
                    <td>
                      {discount.endDate ? 
                        new Date(discount.endDate).toLocaleDateString() : 
                        'No expiry'
                      }
                    </td>
                    <td>
                      {discount.usedCount || 0} / {discount.usageLimit || '∞'}
                      <div>
                        <small className="text-muted">
                          Savings: ₹{(discount.totalSavings || 0).toFixed(2)}
                        </small>
                      </div>
                    </td>
                    <td>
                      {isDiscountExpired(discount) ? (
                        <Badge bg="danger">Expired</Badge>
                      ) : (
                        <Form.Check
                          type="switch"
                          id={`status-${discount.id}`}
                          checked={discount.isActive}
                          onChange={() => handleToggleActive(discount)}
                          label={discount.isActive ? 'Active' : 'Inactive'}
                        />
                      )}
                    </td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        className="me-2 mb-1"
                        onClick={() => handleEditDiscount(discount)}
                      >
                        <FaEdit /> Edit
                      </Button>
                      <Button 
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteDiscount(discount.id)}
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
      
      {/* Discount Form Modal */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? 'Edit Discount Code' : 'Create New Discount Code'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount Code*</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      name="code"
                      value={currentDiscount.code}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., SUMMER25"
                      style={{ textTransform: 'uppercase' }}
                    />
                    <Button 
                      variant="outline-secondary"
                      onClick={generateCouponCode}
                    >
                      Generate
                    </Button>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    name="type"
                    value={currentDiscount.type}
                    onChange={handleInputChange}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {currentDiscount.type === 'percentage' ? 'Percentage*' : 'Amount*'}
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      name="value"
                      value={currentDiscount.value}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step={currentDiscount.type === 'percentage' ? '1' : '0.01'}
                      max={currentDiscount.type === 'percentage' ? '100' : ''}
                      placeholder={currentDiscount.type === 'percentage' ? '10' : '100'}
                    />
                    <InputGroup.Text>
                      {currentDiscount.type === 'percentage' ? '%' : '₹'}
                    </InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Minimum Order Amount</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>₹</InputGroup.Text>
                    <Form.Control
                      type="number"
                      name="minOrderAmount"
                      value={currentDiscount.minOrderAmount}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      placeholder="0"
                    />
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Minimum cart value required
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {currentDiscount.type === 'percentage' ? 'Maximum Discount' : 'Usage Limit'}
                  </Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      {currentDiscount.type === 'percentage' ? '₹' : '#'}
                    </InputGroup.Text>
                    <Form.Control
                      type="number"
                      name={currentDiscount.type === 'percentage' ? 'maxDiscount' : 'usageLimit'}
                      value={currentDiscount.type === 'percentage' ? currentDiscount.maxDiscount : currentDiscount.usageLimit}
                      onChange={handleInputChange}
                      min="0"
                      step={currentDiscount.type === 'percentage' ? '0.01' : '1'}
                      placeholder={currentDiscount.type === 'percentage' ? '200' : '100'}
                    />
                  </InputGroup>
                  <Form.Text className="text-muted">
                    {currentDiscount.type === 'percentage' ? 'Maximum discount amount' : 'Number of times this code can be used'}
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              {currentDiscount.type !== 'percentage' && (
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Usage Limit</Form.Label>
                    <Form.Control
                      type="number"
                      name="usageLimit"
                      value={currentDiscount.usageLimit}
                      onChange={handleInputChange}
                      min="0"
                      step="1"
                      placeholder="Leave empty for unlimited"
                    />
                    <Form.Text className="text-muted">
                      Number of times this code can be used
                    </Form.Text>
                  </Form.Group>
                </Col>
              )}
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date*</Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={currentDiscount.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="endDate"
                    value={currentDiscount.endDate}
                    onChange={handleInputChange}
                  />
                  <Form.Text className="text-muted">
                    Leave empty for no expiry
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                type="text"
                name="description"
                value={currentDiscount.description}
                onChange={handleInputChange}
                placeholder="e.g., Summer sale discount"
              />
            </Form.Group>
            
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Restrictions</Form.Label>
                  <InputGroup className="mb-2">
                    <Form.Control
                      type="text"
                      placeholder="Search products by name"
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                  
                  <Row>
                    <Col md={6}>
                      <Card className="mb-3" style={{ height: '200px', overflowY: 'auto' }}>
                        <Card.Header className="bg-success bg-opacity-10">
                          <div className="d-flex justify-content-between align-items-center">
                            <span>Applicable Products</span>
                            <Badge bg="success">
                              {currentDiscount.applicableProducts?.length || 0}
                            </Badge>
                          </div>
                        </Card.Header>
                        <Card.Body>
                          {products
                            .filter(product => 
                              product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
                            )
                            .map(product => (
                              <Form.Check
                                key={product.id}
                                type="checkbox"
                                id={`applicable-${product.id}`}
                                label={product.name}
                                checked={(currentDiscount.applicableProducts || []).includes(product.id)}
                                onChange={() => toggleProductSelection(product.id, 'applicable')}
                                className="mb-2"
                              />
                            ))
                          }
                          {products.length === 0 && (
                            <div className="text-center py-3">
                              No products found
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                      <Form.Text className="text-muted">
                        If none selected, the discount applies to all products
                      </Form.Text>
                    </Col>
                    <Col md={6}>
                      <Card className="mb-3" style={{ height: '200px', overflowY: 'auto' }}>
                        <Card.Header className="bg-danger bg-opacity-10">
                          <div className="d-flex justify-content-between align-items-center">
                            <span>Excluded Products</span>
                            <Badge bg="danger">
                              {currentDiscount.excludedProducts?.length || 0}
                            </Badge>
                          </div>
                        </Card.Header>
                        <Card.Body>
                          {products
                            .filter(product => 
                              product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
                            )
                            .map(product => (
                              <Form.Check
                                key={product.id}
                                type="checkbox"
                                id={`excluded-${product.id}`}
                                label={product.name}
                                checked={(currentDiscount.excludedProducts || []).includes(product.id)}
                                onChange={() => toggleProductSelection(product.id, 'excluded')}
                                className="mb-2"
                              />
                            ))
                          }
                          {products.length === 0 && (
                            <div className="text-center py-3">
                              No products found
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="discount-active"
                name="isActive"
                checked={currentDiscount.isActive}
                onChange={handleInputChange}
                label="Active"
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2 mt-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Saving...' : (isEditing ? 'Update Discount' : 'Create Discount')}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default DiscountManagement;
