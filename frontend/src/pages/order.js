import React, { useState, useEffect } from 'react';
import OrderTable from '../components/order';
import AdminLayout from '../components/AdminLayout';
import '../components/dashboard.css';
import { API_URL } from '../config/api';

const OrderPage = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [canteens, setCanteens] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedCanteen, setSelectedCanteen] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/branches`)
      .then(res => res.headers.get('content-type')?.includes('application/json') ? res.json() : [])
      .then(data => setBranches(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

    fetch(`${API_URL}/canteens`)
      .then(res => res.headers.get('content-type')?.includes('application/json') ? res.json() : [])
      .then(data => setCanteens(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (user) {
      if (user.role === 'branch_admin') setSelectedBranch(user.branch_id);
      if (user.role === 'canteen_admin') setSelectedCanteen(user.canteen_id);
    }
  }, [user]);

  useEffect(() => {
    let url = `${API_URL}/canteen_orders`;
    if (user) {
      if (user.role === 'branch_admin') url += `?branch_id=${user.branch_id}`;
      if (user.role === 'canteen_admin') url += `?canteen_id=${user.canteen_id}`;
    }

    fetch(url)
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) throw new Error('API endpoint not found. Please restart your backend server.');
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        if (!res.headers.get('content-type')?.includes('application/json')) {
          throw new Error('Received HTML instead of JSON. Check backend URL.');
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setOrders(data);
        } else {
          console.error('API returned non-array data for orders:', data);
          setOrders([]);
        }
      })
      .catch(err => {
        console.error('Error fetching orders:', err);
        setOrders([]);
      });
  }, [user]);

  const filteredOrders = orders.filter(order => {
    if (selectedDate) {
      if (!order.date) return false;
      const d = new Date(order.date);
      const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (dateString !== selectedDate) return false;
    }
    if (selectedBranch && selectedBranch !== 'all') {
      const branch = branches.find(b => String(b.id) === String(selectedBranch));
      if (branch && order.branch !== branch.name) return false;
    }
    if (selectedCanteen && selectedCanteen !== 'all') {
      const canteen = canteens.find(c => String(c.id) === String(selectedCanteen));
      if (canteen && order.canteen !== canteen.name) return false;
    }
    return true;
  });

  const displayedCanteens = selectedBranch && selectedBranch !== 'all'
    ? canteens.filter(c => String(c.branch_id) === String(selectedBranch))
    : canteens;

  return (
    <AdminLayout user={user}>
      <header className="page-header">
        <h1>All Orders</h1>
        <p className="muted">Filter and manage all customer orders.</p>
      </header>

      <div className="card filter-card">
        <div className="filter-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="date-filter">Date</label>
            <input
              id="date-filter"
              type="date"
              className="form-input"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="branch-filter">Branch</label>
            <select
              id="branch-filter"
              className="form-select"
              value={selectedBranch}
              onChange={e => { setSelectedBranch(e.target.value); setSelectedCanteen(''); }}
              disabled={user?.role === 'branch_admin' || user?.role === 'canteen_admin'}
            >
              <option value="">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="canteen-filter">Canteen</label>
            <select
              id="canteen-filter"
              className="form-select"
              value={selectedCanteen}
              onChange={e => setSelectedCanteen(e.target.value)}
              disabled={user?.role === 'canteen_admin'}
            >
              <option value="">All Canteens</option>
              {displayedCanteens.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card" id="orders-page">
        <div className="card-header">
          <h3>Order List</h3>
        </div>
        <OrderTable orders={filteredOrders} />
      </div>
    </AdminLayout>
  );
};

export default OrderPage;
