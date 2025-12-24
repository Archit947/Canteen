import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { API_URL } from '../config/api';
import './user.css';

const UserCheckout = ({ onPlaceOrder }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart = [], branchName, canteenName } = location.state || {};
  const [isPaid, setIsPaid] = useState(false);
  const [savedOrder, setSavedOrder] = useState(null);
  const [userDetails, setUserDetails] = useState({ name: '', phone: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserDetails(prev => ({ ...prev, [name]: value }));
  };

  const totalAmount = cart.reduce((total, item) => {
    const price = parseFloat(item.price.replace('₹', ''));
    return total + (isNaN(price) ? 0 : price);
  }, 0);

  const handlePayment = () => {
    if (!userDetails.name || !userDetails.phone) {
      alert('Please enter your name and phone number to proceed.');
      return;
    }

    const orderId = '#' + Math.floor(1000 + Math.random() * 9000);
    // When running on localhost, use your computer's IP address so the QR code works on mobile.
    // For local testing, window.location.origin is sufficient.
    const baseUrl = window.location.origin;
    const qrPayload = `${baseUrl}/orderdetails?id=${encodeURIComponent(orderId)}`;
    const newOrder = { order_id: orderId, item_names: cart.map(i => i.name).join(', '), branch_name: branchName, canteen_name: canteenName, employee_name: userDetails.name, total_amount: '₹' + totalAmount, status: 'Pending', qr_code: qrPayload };

    fetch(`${API_URL}/api/canteen_orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to save order');
      return res.json();
    })
    .then(saved => {
      const orderWithQr = { ...saved, qr_code: qrPayload };
      if (onPlaceOrder) onPlaceOrder(orderWithQr);
      setSavedOrder(orderWithQr);
      setIsPaid(true);
    })
    .catch(err => {
      console.error('Error placing order:', err);
      alert(`Failed to place order: ${err.message}. Please try again.`);
    });
  };

  if (isPaid) {
    const qrValue = savedOrder?.qr_code || savedOrder?.qr || null;
    return (
      <div className="user-page-wrapper">
          <div className="payment-success-container">
          <div className="payment-success-icon">✓</div>
          <h2>Payment Done!</h2>
          <p className="muted">Your order has been placed successfully.</p>
            {qrValue && (
              <div className="payment-success-qr">
                <QRCode value={qrValue} size={160} />
                <p className="muted">Show this QR code at the counter to verify your order.</p>
              </div>
            )}
          <div className="payment-success-actions">
            <button className="btn btn-primary" onClick={() => navigate('/user-order')}>Back to Home</button>
            <button className="btn btn-secondary" onClick={() => navigate('/usermenu', { state: { ...location.state } })}>Back to Menu</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-page-wrapper">
      <div className="user-checkout-container">
        <header className="page-header">
          <h1>Checkout</h1>
        </header>
        
        <div className="card checkout-summary">
          {cart.map((item, index) => (
            <div key={index} className="checkout-item">
              <span>{item.name}</span>
              <span style={{ fontWeight: '500' }}>{item.price}</span>
            </div>
          ))}
          <div className="checkout-total">
            <span>Total Amount</span>
            <span>₹{totalAmount}</span>
          </div>
        </div>

        <div className="card checkout-details">
          <div className="card-header">
            <h3>Contact Details</h3>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Name</label>
            <input id="name" type="text" name="name" value={userDetails.name} onChange={handleInputChange} placeholder="Enter your name" className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="phone">Phone Number</label>
            <input id="phone" type="tel" name="phone" value={userDetails.phone} onChange={handleInputChange} placeholder="Enter your phone number" className="form-input" />
          </div>
        </div>

        <div className="checkout-actions">
          <button onClick={handlePayment} className="btn btn-primary" style={{ background: 'var(--secondary-accent)' }}>
            Pay ₹{totalAmount}
          </button>
          <button onClick={() => navigate(-1)} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserCheckout;