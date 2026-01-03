import AdminLayout from '../components/AdminLayout';
import { useState, useEffect } from 'react';
import '../components/branch.css';
import { API_URL } from '../config/api';

const BranchAdmin = ({ user }) => {
  const [branches, setBranches] = useState([]);
  const [branchInput, setBranchInput] = useState('');
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/branches`)
      .then(res => res.headers.get('content-type')?.includes('application/json') ? res.json() : [])
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

  const handleAddBranch = (e) => {
    e.preventDefault();
    if (branchInput.trim() !== '') {
      fetch(`${API_URL}/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: branchInput.trim() })
      })
      .then(res => res.json())
      .then(newBranch => {
        setBranches([...branches, newBranch]);
        setErrorMsg(""); 
        setBranchInput('');
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
    if (!window.confirm("Are you sure you want to delete this branch?")) return;

    fetch(`${API_URL}/branches/${id}`, {
      method: 'DELETE'
    })
    .then(res => {
      if (res.ok) {
        setBranches(branches.filter(b => b.id !== id));
        setErrorMsg("");
      } else {
        res.json().then(data => setErrorMsg(data.message || "Failed to delete branch"));
      }
    })
    .catch(err => {
      setErrorMsg("Error deleting branch");
    });
  };

  return (
    <AdminLayout user={user}>
      <header className="page-header">
        <h1>Branches</h1>
        <p className="muted">Add or manage company branches.</p>
      </header>

      {/* TWO COLUMN GRID LAYOUT */}
      <div className="branch-grid">
        
        {/* LEFT - ADD BRANCH FORM */}
        <div className="branch-cards">
          <h3>Add Branch</h3>
          
          <form onSubmit={handleAddBranch} className="branch-form">
            <div className="form-group">
              <input 
                type="text" 
                placeholder="Branch name" 
                value={branchInput} 
                onChange={e => setBranchInput(e.target.value)} 
                className="form-input"
                required
              />
            </div>
            <button type="submit" className="btn-add">Add</button>
          </form>

          {errorMsg && (
            <p className="error-text" style={{ color: 'red', marginTop: '1rem' }}>
              {errorMsg}
            </p>
          )}
        </div>  

        {/* RIGHT - BRANCHES TABLE */}
        <div className="branch-card">
          <h3>Branches</h3>
          
          {branches.length > 0 ? (
            <table className="branch-table">
              <thead>
                <tr>
                  <th>Branch Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((branch) => (
                  <tr key={branch.id}>
                    <td>{branch.name}</td>
                    <td>
                      <button 
                        onClick={() => handleDeleteBranch(branch.id)}
                        className="btn-delete"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted" style={{ padding: '2rem', textAlign: 'center' }}>
              No branches added yet.
            </p>
          )}
        </div>

      </div>
    </AdminLayout>
  );
};

export default BranchAdmin;