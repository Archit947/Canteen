import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import QRCode from 'react-qr-code';
import { API_URL } from '../config/api';
import '../components/dashboard.css';

const OrderDetailsPage = ({ user }) => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    setError(null);

    fetch(`${API_URL}/api/canteen_orders/${encodeURIComponent(orderId)}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error('Order not found (or API missing - restart server)');
          throw new Error(`Failed to fetch order: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setOrder(data);
      })
      .catch((err) => {
        console.error('Error fetching order details:', err);
        setError(err.message || 'Failed to load order details');
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <AdminLayout user={user}>
      <header className="page-header">
        <h1>Order Details</h1>
        <p className="muted">View full information and live status of the order.</p>
      </header>

      <section className="card">
        {loading && <p>Loading order details...</p>}
        {error && !loading && <p className="muted">{error}</p>}
        {!loading && order && (
          <div className="order-details-grid">
            <div className="order-details-main">
              <h3>Summary</h3>
              <div className="order-details-row">
                <span className="label">Order ID</span>
                <span>{order.id}</span>
              </div>
              <div className="order-details-row">
                <span className="label">Customer Name</span>
                <span>{order.employee || '-'}</span>
              </div>
              <div className="order-details-row">
                <span className="label">Items</span>
                <span>{order.item || '-'}</span>
              </div>
              <div className="order-details-row">
                <span className="label">Branch</span>
                <span>{order.branch || '-'}</span>
              </div>
              <div className="order-details-row">
                <span className="label">Canteen</span>
                <span>{order.canteen || '-'}</span>
              </div>
              <div className="order-details-row">
                <span className="label">Total</span>
                <span>{order.total}</span>
              </div>
              <div className="order-details-row">
                <span className="label">Status</span>
                <span className={`status-badge status-${String(order.status || '').toLowerCase()}`}>
                  {order.status}
                </span>
              </div>
              <div className="order-details-row">
                <span className="label">Created At</span>
                <span>{order.date ? new Date(order.date).toLocaleString() : '-'}</span>
              </div>
            </div>

            <div className="order-details-qr">
              <h3>Order QR Code</h3>
              {order.qr ? (
                <div className="order-qr-wrapper">
                  <QRCode value={order.qr} size={180} />
                  <p className="muted">
                    Scan this code to view order details and live status.
                  </p>
                </div>
              ) : (
                <p className="muted">No QR code available for this order.</p>
              )}
            </div>
          </div>
        )}
      </section>
    </AdminLayout>
  );
};

export default OrderDetailsPage;
