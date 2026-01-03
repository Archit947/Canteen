import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from './sidebar';
import './dashboard.css';
import './canteen.css';
import './branch.css';
import { API_URL } from '../config/api';

// Canteen admin can only view the single canteen assigned via user.canteen_id
const CanteenAdmin = ({ user }) => {
  const [branches, setBranches] = useState([]);
  const [canteens, setCanteens] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchRes, canteenRes] = await Promise.all([
          fetch(`${API_URL}/branches`),
          fetch(`${API_URL}/canteens`)
        ]);

        const branchesJson = await branchRes.json();
        const canteensJson = await canteenRes.json();

        setBranches(Array.isArray(branchesJson) ? branchesJson : []);
        setCanteens(Array.isArray(canteensJson) ? canteensJson : []);
      } catch (err) {
        console.error('Error fetching canteen admin data:', err);
        setErrorMsg('Failed to load canteen details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const myCanteen = useMemo(() => {
    if (!user?.canteen_id) return null;
    return canteens.find(c => c.id === Number(user.canteen_id));
  }, [canteens, user]);

  const myBranch = useMemo(() => {
    if (!myCanteen) return null;
    return branches.find(b => b.id === Number(myCanteen.branch_id));
  }, [branches, myCanteen]);

  return (
    <div className="dashboard-container">
      <Sidebar role={user?.role} />
      <main className="dashboard-main">
        <div className="card canteen-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Canteen Admin</p>
              <h3>Your Canteen</h3>
            </div>
          </div>

          {loading && <p className="muted">Loading canteen details…</p>}
          {errorMsg && (
            <p className="error-text" style={{ color: 'red', marginTop: '10px' }}>
              {errorMsg}
            </p>
          )}

          {!loading && !myCanteen && !errorMsg && (
            <p className="muted">
              No canteen is assigned to this account. Please contact an admin.
            </p>
          )}

          {!loading && myCanteen && (
            <div style={{ marginTop: '1rem' }}>
              <div className="branch-input-group" style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <p className="eyebrow">Canteen Name</p>
                  <h4 style={{ margin: 0 }}>{myCanteen.name}</h4>
                </div>
                <div style={{ flex: 1 }}>
                  <p className="eyebrow">Branch</p>
                  <h4 style={{ margin: 0 }}>{myBranch ? myBranch.name : '-'}</h4>
                </div>
              </div>

              <p className="muted" style={{ marginTop: '12px' }}>
                You have read-only access to the canteen assigned to your account.
                To change details, ask a super admin to update your assignment.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CanteenAdmin;
