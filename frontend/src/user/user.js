import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import bgImage from '../image/photo-1543353071-10c8ba85a904.jpg';
import './user.css';
import { API_URL } from '../config/api';

const UserOrder = () => {
  const navigate = useNavigate();
  const [allBranches, setAllBranches] = useState([]);
  const [allCanteens, setAllCanteens] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedCanteenId, setSelectedCanteenId] = useState('');

  useEffect(() => {
    const fetchData = async (url, setter) => {
      try {
        const res = await fetch(url);
        const contentType = res.headers.get("content-type");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Received HTML instead of JSON. Check API URL.");
        }
        const data = await res.json();
        setter(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(`Error fetching ${url}:`, error);
      }
    };

    fetchData(`${API_URL}/api/branches`, setAllBranches);
    fetchData(`${API_URL}/api/canteens`, setAllCanteens);
  }, []);

  const availableCanteens = selectedBranchId ? allCanteens.filter(c => c.branch_id === Number(selectedBranchId)) : [];

  const handleContinue = (e) => {
    e.preventDefault();
    const branch = allBranches.find(b => b.id === Number(selectedBranchId));
    const canteen = allCanteens.find(c => c.id === Number(selectedCanteenId));
    navigate('/usermenu', {
      state: {
        selectedBranchId,
        selectedCanteenId,
        branchName: branch ? branch.name : '',
        canteenName: canteen ? canteen.name : ''
      }
    });
  };

  const backgroundStyle = {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${bgImage})`
  };

  return (
    <div className="user-order-background" style={backgroundStyle}>
      <div className="user-order-card">
        <div className="user-order-header">
          <h3>Order Food</h3>
          <button className="btn btn-secondary" onClick={() => navigate('/login')}>
            Admin Login
          </button>
        </div>

        <form onSubmit={handleContinue}>
          <div className="form-group">
            <label className="form-label" htmlFor="branch-select">Select Branch</label>
            <select
              id="branch-select"
              value={selectedBranchId}
              onChange={(e) => {
                setSelectedBranchId(e.target.value);
                setSelectedCanteenId('');
              }}
              required
              className="form-select"
            >
              <option value="">Select a branch</option>
              {allBranches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="canteen-select">Select Canteen</label>
            <select
              id="canteen-select"
              value={selectedCanteenId}
              onChange={(e) => setSelectedCanteenId(e.target.value)}
              required
              className="form-select"
              disabled={!selectedBranchId}
            >
              <option value="">Select a canteen</option>
              {availableCanteens.map(canteen => (
                <option key={canteen.id} value={canteen.id}>{canteen.name}</option>
              ))}
            </select>
          </div>

          {selectedBranchId && selectedCanteenId && (
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Continue
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default UserOrder;
