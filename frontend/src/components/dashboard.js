import React, { useRef, useState, useEffect } from 'react';
import OrderTable from './order'; 
import AdminLayout, { useSidebar } from './AdminLayout';
import './dashboard.css';
import { API_URL } from '../config/api';


const DashboardContent = ({ orders = [], stats, user, onOrderUpdate }) => {
  const { setSidebarOpen } = useSidebar();
  const dateInputRef = useRef(null);
  const [branches, setBranches] = useState([]);
  const [canteens, setCanteens] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedCanteen, setSelectedCanteen] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    if (user?.role === 'branch_admin') {
      setSelectedBranch(user.branch_id);
    }
    if (user?.role === 'canteen_admin') {
      setSelectedCanteen(user.canteen_id);
    }
  }, [user]);

  useEffect(() => {
    fetch(`${API_URL}/branches`)
      .then(res => {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return res.json();
        }
        throw new Error("Received HTML instead of JSON");
      })
      .then(data => {
        if (Array.isArray(data)) {
          setBranches(data);
        } else {
          console.error('API returned non-array data for branches:', data);
          setBranches([]); // Fallback to empty array
        }
      })
      .catch(err => {
        console.error('Error fetching branches:', err);
        setBranches([]); // Ensure branches is an array even on fetch error
      });

    fetch(`${API_URL}/canteens`)
      .then(res => {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return res.json();
        }
        throw new Error("Received HTML instead of JSON");
      })
      .then(data => {
        if (Array.isArray(data)) {
          setCanteens(data);
        } else {
          console.error('API returned non-array data for canteens:', data);
          setCanteens([]);
        }
      })
      .catch(err => {
        console.error('Error fetching canteens:', err);
        setCanteens([]);
      });
  }, []);

  const openCalendar = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current.focus();
        dateInputRef.current.click();
        
      }
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (selectedBranch !== 'all') {
      const branch = branches.find((b) => b.id === Number(selectedBranch));
      if (branch && order.branch !== branch.name) {
        return false;
      }
    }
    if (selectedCanteen !== 'all') {
      const canteen = canteens.find((c) => c.id === Number(selectedCanteen));
      if (canteen && order.canteen !== canteen.name) {
        return false;
      }
    }
    if (selectedDate) {
      if (!order.date) return false;
      const d = new Date(order.date);
      const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (dateString !== selectedDate) return false;
    }
    return true;
  });

  const displayedCanteens = selectedBranch === 'all'
    ? canteens
    : canteens.filter((c) => c.branch_id === Number(selectedBranch));

  // Calculate stats for the "Today's / Selected Date" block
  const getDailyStats = () => {
    let relevantOrders = filteredOrders;

    if (!selectedDate) {
      // If no date selected, filteredOrders contains all dates. Filter for Today.
      const today = new Date();
      relevantOrders = filteredOrders.filter(order => {
        if (!order.date) return false;
        const d = new Date(order.date);
        return d.getDate() === today.getDate() &&
               d.getMonth() === today.getMonth() &&
               d.getFullYear() === today.getFullYear();
      });
    }
    
    const count = relevantOrders.length;
    const earnings = relevantOrders.reduce((sum, order) => {
      return sum + (parseFloat(String(order.total).replace(/[^\d.-]/g, '')) || 0);
    }, 0);

    return { count, earnings };
  };

  const { count: dailyOrdersCount, earnings: dailyEarnings } = getDailyStats();

  const displayedTotalEarnings = orders.reduce((sum, order) => {
    return sum + (parseFloat(String(order.total).replace(/[^\d.-]/g, '')) || 0);
  }, 0);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Company Canteen</p>
          <h1>Admin Dashboard</h1>
          <p className="muted">Track orders, earnings, and kitchen load in real time.</p>
        </div>
        <button
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(true)}
        >
          ☰
        </button>
      </header>

        <section className="grid stats">
          {[
            { label: selectedDate ? "Orders (Selected Date)" : "Today's Orders", value: dailyOrdersCount },
            { label: selectedDate ? "Earnings (Selected Date)" : "Today's Earnings", value: `₹${dailyEarnings}` },
            { label: 'Total Earnings', value: `₹${displayedTotalEarnings}` },
          ].map((stat) => (
          <div key={stat.label} className="card stat-card">
            <p className="muted">{stat.label}</p>
            <div className="stat-value">{stat.value}</div>
            <p className="delta">{stat.delta}</p>
          </div>
        ))}
      </section>

      <section className="card filter-card">
        <div className="filter-grid">
          <div className="filter-block date-block">
            <p className="eyebrow">Filter Date</p>
            <div className="date-display"></div>
            <div className="date-input">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                ref={dateInputRef}
              />
            </div>

          </div>
          <div className="filter-block">
            <p className="eyebrow">Branch</p>
            <select 
              className="form-input" 
              value={selectedBranch} 
              disabled={user?.role === 'branch_admin' || user?.role === 'canteen_admin'}
              onChange={(e) => { setSelectedBranch(e.target.value); setSelectedCanteen('all'); }}
            >
              <option value="all">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-block">
            <p className="eyebrow">Canteen</p>
            <select 
              className="form-input" 
              value={selectedCanteen} 
              disabled={user?.role === 'canteen_admin'}
              onChange={(e) => setSelectedCanteen(e.target.value)}
            >
              <option value="all">All Canteens</option>
              {Array.isArray(displayedCanteens) && displayedCanteens.map((canteen) => (
                <option key={canteen.id} value={canteen.id}>{canteen.name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="card" id="orders">
        <div className="card-header">
          <h3>Recent Orders</h3>
          <span className="tag">Live</span>
        </div>
        <OrderTable
          orders={filteredOrders.slice(0, 5)}
          onOrderUpdate={onOrderUpdate}
        />
      </section>
    </>
  );
};

const Dashboard = ({ orders = [], stats, user, onOrderUpdate, onLogout }) => {
  return (
    <AdminLayout user={user} onLogout={onLogout}>
      <DashboardContent
        orders={orders}
        stats={stats}
        user={user}
        onOrderUpdate={onOrderUpdate}
      />
    </AdminLayout>
  );
};

export default Dashboard;
