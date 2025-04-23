import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Form, Row, Col, Modal } from 'react-bootstrap';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-toastify';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';

function DiscountManagement() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentDiscount, setCurrentDiscount] = useState(null);
  
  // Form states
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [value, setValue] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  useEffect(() => {
    fetchDiscounts();
  }, []);
  
  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const discountsRef = collection(db, 'discounts');
      const discountsSnapshot = await getDocs(discountsRef);
      const discountsList = discountsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate ? new Date(doc.data().startDate).toISOString().split('T')[0] : '',
        endDate: doc.data().endDate ? new Date(doc.data().endDate).toISOString().split('T')[0] : ''
      }));
      setDiscounts(discountsList);
    } catch (error) {
      console.error("Error fetching discounts:", error);
      toast.error("Failed to fetch discounts");
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setCode('');
    setDiscountType('percentage');
    setValue('');
    setMinAmount('');
    setMaxAmount('');
    setStartDate('');
    setEndDate('');
    setIsActive(true);
    setEditMode(false);
    setCurrentDiscount(null);
  };
  
  const handleAddDiscount = () => {
    resetForm();
    setShowModal(true);
  };
  
  const handleEditDiscount = (discount) => {
    setCurrentDiscount(discount);
    setCode(discount.code);
    setDiscountType(discount.type);
    setValue(discount.value);
    setMinAmount(discount.minAmount || '');
    setMaxAmount(discount.maxAmount || '');
    setStartDate(discount.startDate || '');
    setEndDate(discount.endDate || '');
    setIsActive(discount.isActive);
    setEditMode(true);
    setShowModal(true);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const discountData = {
        code: code.toUpperCase(),
        type: discountType,
        value: parseFloat(value),
        minAmount: minAmount ? parseFloat(minAmount) : null,
        maxAmount: maxAmount ? parseFloat(maxAmount) : null,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        isActive: isActive,
        updatedAt: serverTimestamp()
      };
      
      if (editMode && currentDiscount) {
        // Update existing discount
        const discountRef = doc(db, 'discounts', currentDiscount.id);
        await updateDoc(discountRef, discountData);
        toast.success("Discount updated successfully");
      } else {
        // Add new discount
        discountData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'discounts'), discountData);
        toast.success("Discount added successfully");
      }
      
      fetchDiscounts();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Error saving discount:", error);
      toast.error("Failed to save discount");
    }
  };
  
  const handleDeleteDiscount = async (discountId) => {
    if (window.confirm("Are you sure you want to delete this discount?")) {
      try {
        await deleteDoc(doc(db, 'discounts', discountId));
        toast.success("Discount deleted successfully");
        fetchDiscounts();
      } catch (error) {
        console.error("Error deleting discount:", error);
        toast.error("Failed to delete discount");
      }
    }
  };
  
  const handleToggleStatus = async (discount) => {
    try {
      const discountRef = doc(db, 'discounts', discount.id);
      await updateDoc(discountRef, { 
        isActive: !discount.isActive,
        updatedAt: serverTimestamp()
      });
      toast.success(`Discount ${!discount.isActive ? 'activated' : 'deactivated'} successfully`);
      fetchDiscounts();
    } catch (error) {
      console.error("Error updating discount status:", error);
      toast.error("Failed to update discount status");
    }
  };
  
  return (
    <div className="d-flex">
      <AdminSidebar />
      <div className="flex-grow-1">
        <AdminHeader title="Discount Management" />
        <Container fluid className="py-3">
          <Card className="shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Discounts & Coupons</h5>
              <Button variant="primary" onClick={handleAddDiscount}>
                Add New Discount
              </Button>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <p>Loading discounts...</p>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Type</th>
                        <th>Value</th>
                        <th>Min Amount</th>
                        <th>Max Discount</th>
                        <th>Valid Period</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discounts.length > 0 ? (
                        discounts.map(discount => (
                          <tr key={discount.id}>
                            <td>{discount.code}</td>
                            <td>{discount.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}</td>
                            <td>
                              {discount.type === 'percentage' ? `${discount.value}%` : `₹${discount.value}`}
                            </td>
                            <td>{discount.minAmount ? `₹${discount.minAmount}` : 'None'}</td>
                            <td>{discount.maxAmount ? `₹${discount.maxAmount}` : 'None'}</td>
                            <td>
                              {discount.startDate && discount.endDate
                                ? `${new Date(discount.startDate).toLocaleDateString()} - ${new Date(discount.endDate).toLocaleDateString()}`
                                : 'Always Valid'}
                            </td>
                            <td>
                              <span className={`badge bg-${discount.isActive ? 'success' : 'danger'}`}>
                                {discount.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="me-2"
                                onClick={() => handleEditDiscount(discount)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant={discount.isActive ? "outline-warning" : "outline-success"} 
                                size="sm"
                                className="me-2"
                                onClick={() => handleToggleStatus(discount)}
                              >
                                {discount.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleDeleteDiscount(discount.id)}
                              >
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center">No discounts found</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>
        
        {/* Add/Edit Discount Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>{editMode ? 'Edit Discount' : 'Add New Discount'}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Discount Code</Form.Label>
                <Form.Control 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  placeholder="e.g. SUMMER20"
                />
                <Form.Text className="text-muted">
                  Code will be converted to uppercase automatically.
                </Form.Text>
              </Form.Group>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Discount Type</Form.Label>
                    <Form.Select 
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      required
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      {discountType === 'percentage' ? 'Percentage Value (%)' : 'Discount Amount (₹)'}
                    </Form.Label>
                    <Form.Control 
                      type="number" 
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      required
                      min="0"
                      step={discountType === 'percentage' ? '1' : '0.01'}
                      max={discountType === 'percentage' ? '100' : ''}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Minimum Order Amount (₹)</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="Optional"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Maximum Discount Amount (₹)</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="Optional"
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Start Date</Form.Label>
                    <Form.Control 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>End Date</Form.Label>
                    <Form.Control 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-3">
                <Form.Check 
                  type="checkbox" 
                  label="Active" 
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editMode ? 'Update Discount' : 'Add Discount'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </div>
  );
}

export default DiscountManagement;
