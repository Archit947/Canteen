import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import './order.css';
import { API_URL } from '../config/api';

const statusClass = (status) =>
  status ? status.toLowerCase().replace(' ', '-') : '';

// Custom Modal Component
const Modal = ({ isOpen, onClose, title, message, type = 'info', onConfirm, onCancel, showCancel = false }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={handleCancel}>×</button>
        </div>
        <div className="modal-body">
          <p className="modal-message">{message}</p>
        </div>
        <div className="modal-footer">
          {showCancel && (
            <button className="modal-btn modal-btn-cancel" onClick={handleCancel}>
              Cancel
            </button>
          )}
          <button 
            className={`modal-btn modal-btn-${type}`} 
            onClick={handleConfirm}
          >
            {showCancel ? 'Confirm' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};

const OrderTable = ({ orders: initialOrders = [], onOrderUpdate }) => {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    onCancel: null,
    showCancel: false
  });
  const [pendingStatusChange, setPendingStatusChange] = useState(null);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const handleStatusChange = (orderId, newStatus) => {
    const order = orders.find((o) => o.id === orderId);
    const previousStatus = order?.status;

    if (newStatus === 'Delivered') {
      // Revert the select to previous status immediately, then show confirmation
      setOrders((currentOrders) =>
        currentOrders.map((o) =>
          o.id === orderId ? { ...o, status: previousStatus } : o
        )
      );
      // Store the pending change
      setPendingStatusChange({ orderId, newStatus, previousStatus });
      setModal({
        isOpen: true,
        title: 'Confirm Delivery',
        message: 'Are you sure you want to mark this order as Delivered? This status cannot be changed later.',
        type: 'confirm',
        onConfirm: () => {
          updateOrderStatus(orderId, newStatus);
          setPendingStatusChange(null);
        },
        onCancel: () => {
          // Already reverted, just clear pending change
          setPendingStatusChange(null);
        },
        showCancel: true
      });
      return;
    }

    if (newStatus === 'Cancelled') {
      setModal({
        isOpen: true,
        title: 'Confirm Cancellation',
        message: 'Are you sure you want to cancel this order?',
        type: 'warning',
        onConfirm: () => {
          updateOrderStatus(orderId, newStatus);
        },
        onCancel: null,
        showCancel: true
      });
      return;
    }

    updateOrderStatus(orderId, newStatus);
  };

  const updateOrderStatus = (orderId, newStatus) => {
    // The order ID may contain special characters like '#' which must be encoded.
    const encodedOrderId = encodeURIComponent(orderId);

    const url = `${API_URL}/canteen_orders/${encodedOrderId}`;
    console.log("Sending PUT request to:", url);

    fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
      .then(async (res) => {
        const contentType = res.headers.get('content-type');
        if (!res.ok) {
          if (contentType && contentType.includes('application/json')) {
            const errJson = await res.json();
            throw new Error(errJson.message || errJson.sqlMessage || `Server error: ${res.status}`);
          }
          throw new Error(`Server error: ${res.status}`);
        }
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error("Received HTML instead of JSON. Check backend URL.");
        }
        return res.json();
      })
      .then((updatedOrder) => {
        setOrders((currentOrders) =>
          currentOrders.map((order) =>
            order.id === updatedOrder.id
              ? { ...order, ...updatedOrder }
              : order
          )
        );
        if (onOrderUpdate) {
          onOrderUpdate(updatedOrder);
        }
      })
      .catch((err) => {
        console.error('Error updating order status:', err);
        setModal({
          isOpen: true,
          title: 'Error',
          message: err.message || 'An error occurred while updating the order status.',
          type: 'error',
          onConfirm: null,
          showCancel: false
        });
      });
  };

  return (
    <div className="orders-container">
        <Modal
          isOpen={modal.isOpen}
          onClose={() => {
            if (modal.onCancel) {
              modal.onCancel();
            }
            setModal({ ...modal, isOpen: false });
          }}
          title={modal.title}
          message={modal.message}
          type={modal.type}
          onConfirm={modal.onConfirm}
          onCancel={modal.onCancel}
          showCancel={modal.showCancel}
        />
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Total</th>
              <th>Date</th>
              <th>Status</th>
              <th>Item</th>
              <th>QR</th>
              <th>Branch</th>
              <th>Canteen</th>
              <th>Employee</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.total}</td>
                <td>{order.date ? new Date(order.date).toLocaleString() : '-'}</td>
                <td>
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order.id, e.target.value)
                    }
                    disabled={order.status === 'Delivered' || order.status === 'Cancelled'}
                    className={`status ${statusClass(order.status)} ${
                      order.status === 'Delivered' || order.status === 'Cancelled'
                        ? 'disabled'
                        : ''
                    }`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Completed">Completed</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </td>
                <td>{order.item || '-'}</td>
                <td>
                  {order.qr_code ? (
                    <QRCode value={order.qr_code} size={64} />
                  ) : (
                    <button
                      className="view-order-btn"
                      onClick={() => navigate(`/order-details/${encodeURIComponent(order.id)}`)}
                      style={{ 
                        padding: '6px 12px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      View
                    </button>
                  )}
                </td>
                <td>{order.branch || '-'}</td>
                <td>{order.canteen || '-'}</td>
                <td>{order.employee || '-'}</td>
                <td>
                  {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                    <>
                      <button
                        className="mark-delivered-btn"
                        onClick={() => handleStatusChange(order.id, 'Delivered')}
                      >
                        Delivered
                      </button>
                      <button
                        className="cancel-order-btn"
                        onClick={() => handleStatusChange(order.id, 'Cancelled')}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
    </div>
  );
};

export default OrderTable;
