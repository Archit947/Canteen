import React, { useEffect, useState } from 'react';
import Sidebar from './sidebar';
import './dashboard.css';
import './branch.css';
import { API_URL } from '../config/api';

const BranchAdmin = ({ user }) => {
  const [branches, setBranches] = useState([]);
  const [branchInput, setBranchInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/branches`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBranches(data);
        } else {
          setBranches([]);
        }
      })
      .catch(err => {
        console.error('Error fetching branches:', err);
        setBranches([]);
      });
  }, []);

  const handleAddBranch = () => {
    const name = branchInput.trim();
    if (!name) {
      setErrorMsg('Branch name cannot be empty.');
      return;
    }

    fetch(`${API_URL}/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
      .then(res => res.json())
      .then(newBranch => {
        setBranches(prev => [...prev, newBranch]);
        setErrorMsg('');
        setBranchInput('');
        setShowInput(false);
      })
      .catch(err => {
        console.error('Error adding branch:', err);
        setErrorMsg(`Failed to add branch: ${err.message || 'Server error'}`);
      });
  };

  return (
    <div className="dashboard-container">
      <Sidebar role={user?.role} />
      <main className="dashboard-main">
        <div className="card" id="branches-page">
          <div className="card-header">
            <h3>Manage Branches</h3>
            <button
              className="btn-primary"
              onClick={() => setShowInput(!showInput)}
            >
              {showInput ? 'Cancel' : 'Add Branch'}
            </button>
          </div>

          {showInput && (
            <div className="branch-input-group">
              <input
                type="text"
                placeholder="Branch name..."
                value={branchInput}
                onChange={e => setBranchInput(e.target.value)}
                className="form-input"
              />
              <button className="btn-primary" onClick={handleAddBranch}>
                Save
              </button>
            </div>
          )}

          {errorMsg && (
            <p className="error-text" style={{ color: 'red', marginTop: '10px' }}>
              {errorMsg}
            </p>
          )}

          <ul className="branch-list">
            {branches.map((branch, idx) => (
              <li key={idx} className="branch-item">
                {branch.name}
              </li>
            ))}
            {branches.length === 0 && (
              <li className="branch-item muted">No branches added yet.</li>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default BranchAdmin;
