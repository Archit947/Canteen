import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';
import './user.css';

const OrderDetails = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('id');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) {
      setError('No order ID specified.');
      setLoading(false);
      return;
    }

    // Try fetching with the orderId as-is first (it might have '#' or not)
    // Note: We encode the ID because it might contain special characters like '#'
    fetch(`${API_URL}/api/canteen_orders/${encodeURIComponent(orderId)}`)
      .then(res => {
          if (!res.ok) {
          if (res.status === 404) {
            // If orderId has '#', try without it; if it doesn't, try with it
            const alternateOrderId = orderId.startsWith('#') ? orderId.substring(1) : `#${orderId}`;
            return fetch(`${API_URL}/api/canteen_orders/${encodeURIComponent(alternateOrderId)}`)
              .then(res2 => {
                if (!res2.ok) {
                  throw new Error(`Order not found. Tried: ${orderId} and ${alternateOrderId}`);
                }
                return res2.json();
              });
          }
          throw new Error(`Failed to fetch order: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        // If the API returns an array, take the first item, otherwise take the object
        const orderData = Array.isArray(data) ? data[0] : data;
        if (!orderData) {
          throw new Error('Order not found');
        }
        setOrder(orderData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching order:', err);
        console.error('OrderId attempted:', orderId);
        setError('Could not load order details.');
        setLoading(false);
      });
  }, [orderId]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return '#10b981';
      case 'completed': return '#059669';
      case 'processing': return '#f59e0b';
      case 'pending': return '#6b7280';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return '✓';
      case 'completed': return '✓';
      case 'processing': return '⟳';
      case 'pending': return '⏳';
      case 'cancelled': return '✗';
      default: return '•';
    }
  };

  if (loading) return (
    <div className="user-page-wrapper">
      <div className="user-container" style={{textAlign: 'center', padding: '3rem'}}>
        <div style={{fontSize: '2rem', marginBottom: '1rem'}}>⟳</div>
        <p style={{fontSize: '1.1rem', color: '#666'}}>Loading your order details...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="user-page-wrapper">
      <div className="user-container" style={{textAlign: 'center', padding: '3rem'}}>
        <div style={{fontSize: '3rem', marginBottom: '1rem', color: '#ef4444'}}>⚠</div>
        <p className="error-text" style={{fontSize: '1.1rem', marginBottom: '2rem'}}>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/user-order')} style={{padding: '12px 24px', fontSize: '1rem'}}>Go to Home</button>
      </div>
    </div>
  );

  if (!order) return null;

  return (
    <div className="user-page-wrapper" style={{overflowY: 'auto', height: '100vh'}}>
      <div className="user-checkout-container" style={{maxWidth: '600px', margin: '0 auto'}}>
        <header className="page-header" style={{textAlign: 'center', marginBottom: '2rem'}}>
          <h1 style={{fontSize: '2.5rem', color: '#1f2937', marginBottom: '0.5rem'}}>🍽 Order Details</h1>
          <p style={{color: '#6b7280', fontSize: '1.1rem'}}>Track your delicious order</p>
        </header>

        <div className="card" style={{borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden'}}>
          <div className="card-header" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '2rem', textAlign: 'center'}}>
            <h3 style={{margin: '0', fontSize: '1.5rem'}}>Order {order.order_id || order.id}</h3>
            <div style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.2)', 
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: '20px', 
              fontWeight: 'bold',
              fontSize: '0.9rem',
              marginTop: '1rem'
            }}>
              <span style={{marginRight: '8px', fontSize: '1.2rem'}}>{getStatusIcon(order.status)}</span>
              {order.status}
            </div>
          </div>
          
          <div style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px' }}>
              <div style={{display: 'flex', alignItems: 'center', marginBottom: '1rem'}}>
                <span style={{fontSize: '1.5rem', marginRight: '10px'}}>🍔</span>
                <h4 style={{margin: '0', color: '#1f2937'}}>Order Items</h4>
              </div>
              <p style={{ fontSize: '1.1rem', fontWeight: '500', color: '#374151', lineHeight: '1.6' }}>{order.item_names || order.item || order.items}</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{background: '#f0f9ff', padding: '1.5rem', borderRadius: '12px', textAlign: 'center'}}>
                <div style={{fontSize: '1.5rem', marginBottom: '0.5rem'}}>💰</div>
                <p className="muted" style={{ marginBottom: '0.25rem', fontSize: '0.9rem' }}>Total Amount</p>
                <p style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#1f2937' }}>{order.total_amount || order.total}</p>
              </div>
              <div style={{background: '#fef3c7', padding: '1.5rem', borderRadius: '12px', textAlign: 'center'}}>
                <div style={{fontSize: '1.5rem', marginBottom: '0.5rem'}}>📅</div>
                <p className="muted" style={{ marginBottom: '0.25rem', fontSize: '0.9rem' }}>Order Date</p>
                <p style={{fontSize: '1rem', color: '#1f2937'}}>
                  {order.created_at ? new Date(order.created_at).toLocaleDateString() : (order.date ? new Date(order.date).toLocaleDateString() : '-')}
                </p>
              </div>
              <div style={{background: '#ecfdf5', padding: '1.5rem', borderRadius: '12px', textAlign: 'center'}}>
                <div style={{fontSize: '1.5rem', marginBottom: '0.5rem'}}>🏢</div>
                <p className="muted" style={{ marginBottom: '0.25rem', fontSize: '0.9rem' }}>Branch</p>
                <p style={{fontSize: '1rem', color: '#1f2937'}}>{order.branch_name || order.branch}</p>
              </div>
              <div style={{background: '#fef2f2', padding: '1.5rem', borderRadius: '12px', textAlign: 'center'}}>
                <div style={{fontSize: '1.5rem', marginBottom: '0.5rem'}}>🍽</div>
                <p className="muted" style={{ marginBottom: '0.25rem', fontSize: '0.9rem' }}>Canteen</p>
                <p style={{fontSize: '1rem', color: '#1f2937'}}>{order.canteen_name || order.canteen}</p>
              </div>
            </div>

            {order.employee_name && (
              <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f3f4f6', borderRadius: '12px' }}>
                <div style={{display: 'flex', alignItems: 'center', marginBottom: '1rem'}}>
                  <span style={{fontSize: '1.5rem', marginRight: '10px'}}>👤</span>
                  <h4 style={{margin: '0', color: '#1f2937'}}>Customer Details</h4>
                </div>
                <p style={{fontSize: '1.1rem', color: '#374151'}}>{order.employee_name}</p>
              </div>
            )}
          </div>
        </div>

        <div className="checkout-actions" style={{textAlign: 'center', marginTop: '2rem'}}>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/user-order')} 
            style={{
              padding: '14px 32px', 
              fontSize: '1.1rem', 
              borderRadius: '25px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            🍽 Place New Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
