import Sidebar from '../components/sidebar';    
import { useState, useEffect } from 'react';
import '../components/dashboard.css';
import '../components/branch.css';

const BranchPage = ({ onLogout }) => {
  const [branches, setBranches] = useState([]);
  const [branchInput, setBranchInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch('http://localhost:5000/api/branches')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBranches(data);
        } else {
          console.error('API returned non-array data for branches:', data);
          setBranches([]);
        }
      })
      .catch(err => {
        console.error('Error fetching branches:', err);
        setBranches([]);
      });
  }, []);

  const handleAddBranch = () => {
    if (branchInput.trim() !== '') {
      fetch('http://localhost:5000/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: branchInput.trim() })
      })
      .then(res => res.json())
      .then(newBranch => {
        setBranches([...branches, newBranch]);
        setErrorMsg(""); // Clear any previous error
        setBranchInput('');
        setShowInput(false);
      })
      .catch(err => {
        console.error('Error adding branch:', err);
        setErrorMsg(`Failed to add branch: ${err.message || 'Server error'}`);
      });
    } else {
      setErrorMsg("Branch name cannot be empty.");
    }
  };

  const handleDeleteBranch = (id) => {
    if (window.confirm("Are you sure you want to delete this branch?")) {
      fetch(`http://localhost:5000/api/branches/${id}`, {
        method: 'DELETE'
      })
      .then(res => {
        if (res.ok) {
          setBranches(branches.filter(b => b.id !== id));
        } else {
          return res.json().then(data => {
            throw new Error(data.message || 'Failed to delete branch');
          });
        }
      })
      .catch(err => setErrorMsg(err.message));
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar onLogout={onLogout} />
      <main className="dashboard-main">
        <div className="card" id="branches-page">
          <div className="card-header">
            <h3>Branches</h3>
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
              <button 
                className="btn-primary"
                onClick={handleAddBranch}
              >
                Save
              </button>
            </div>
          )}
          {errorMsg && (
            <p className="error-text" style={{ color: 'red', marginTop: '10px' }}>{errorMsg}</p>
          )}
          <ul className="branch-list">
            {branches.map((branch) => (
              <li key={branch.id} className="branch-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{branch.name}</span>
                <button 
                  className="btn-primary" 
                  onClick={() => handleDeleteBranch(branch.id)}
                  style={{ background: '#dc3545', marginLeft: '10px', border: 'none' }}
                >
                  Delete
                </button>
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

export default BranchPage;
