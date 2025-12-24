import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import './branch.css'; // Reusing branch list styles
import './adminmag.css';

const Adminmag = ({ user, onLogout }) => {
  const [admins, setAdmins] = useState([]);
  const [branches, setBranches] = useState([]);
  const [canteens, setCanteens] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [role, setRole] = useState('branch_admin');
  const [branchId, setBranchId] = useState('');
  const [canteenId, setCanteenId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const canManage = user?.role === 'main_admin';

  const selectedAdmin = useMemo(
    () => admins.find(a => a.id === Number(selectedId)),
    [admins, selectedId]
  );

  useEffect(() => {
    fetch('http://localhost:5000/api/admins').then(res => res.json()).then(data => setAdmins(Array.isArray(data) ? data : [])).catch(err => console.error('Error fetching admins:', err));
    fetch('http://localhost:5000/api/branches').then(res => res.json()).then(data => setBranches(Array.isArray(data) ? data : [])).catch(err => console.error('Error fetching branches:', err));
    fetch('http://localhost:5000/api/canteens').then(res => res.json()).then(data => setCanteens(Array.isArray(data) ? data : [])).catch(err => console.error('Error fetching canteens:', err));
  }, []);

  useEffect(() => {
    if (selectedAdmin) {
      setRole(selectedAdmin.role || 'branch_admin');
      setBranchId(selectedAdmin.branch_id || '');
      setCanteenId(selectedAdmin.canteen_id || '');
    } else {
      setRole('branch_admin');
      setBranchId('');
      setCanteenId('');
    }
  }, [selectedAdmin]);

  const handleUpdate = () => {
    setMessage('');
    setError('');
    if (!selectedId) return setError('Select an admin first');
    if (role === 'branch_admin' && !branchId) return setError('Select a branch');
    if (role === 'canteen_admin' && !canteenId) return setError('Select a canteen');
    
    const payload = { role, branch_id: role === 'branch_admin' ? branchId : null, canteen_id: role === 'canteen_admin' ? canteenId : null };
    
    fetch(`http://localhost:5000/api/admins/${selectedId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update role');
        return res.json();
      })
      .then(updated => {
        setAdmins(prev => prev.map(a => (a.id === Number(updated.id) ? { ...a, ...updated } : a)));
        setMessage('Role updated successfully.');
        setTimeout(() => setMessage(''), 3000);
      })
      .catch(err => setError(err.message));
  };

  const handleDeleteById = (adminId) => {
    if (Number(adminId) === user?.id) return setError('You cannot delete your own account');
    
    if (window.confirm('Are you sure you want to delete this admin?')) {
      fetch(`http://localhost:5000/api/admins/${adminId}`, { method: 'DELETE' })
        .then(res => {
          if (!res.ok) throw new Error('Failed to delete admin');
          return res.json();
        })
        .then(() => {
          setAdmins(prev => prev.filter(a => a.id !== Number(adminId)));
          if (String(adminId) === String(selectedId)) setSelectedId('');
          setMessage('Admin deleted successfully.');
          setTimeout(() => setMessage(''), 3000);
        })
        .catch(err => setError(err.message));
    }
  };

  return (
    <AdminLayout user={user} onLogout={onLogout}>
        <header className="page-header">
          <h1>Admin Management</h1>
          <p className="muted">Assign roles and permissions to administrators.</p>
        </header>

        {!canManage && <div className="card"><p className="muted">Only main administrators can manage roles.</p></div>}

        {canManage && (
          <div className="branch-grid">
            <div className="card">
              <div className="card-header">
                <h3>Assign Role</h3>
              </div>
              <div className="admin-form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="admin-select">Admin</label>
                  <select id="admin-select" className="form-select" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                    <option value="">Select an admin</option>
                    {admins.map(a => <option key={a.id} value={a.id}>{a.username} ({a.role})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="role-select">Role</label>
                  <select id="role-select" className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                    <option value="branch_admin">Branch Admin</option>
                    <option value="canteen_admin">Canteen Admin</option>
                    <option value="main_admin">Main Admin</option>
                  </select>
                </div>
                {role === 'branch_admin' && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="branch-assign">Assign to Branch</label>
                    <select id="branch-assign" className="form-select" value={branchId} onChange={e => setBranchId(e.target.value)} required>
                      <option value="">Select branch</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                )}
                {role === 'canteen_admin' && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="canteen-assign">Assign to Canteen</label>
                    <select id="canteen-assign" className="form-select" value={canteenId} onChange={e => setCanteenId(e.target.value)} required>
                      <option value="">Select canteen</option>
                      {canteens.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="admin-form-actions">
                <button className="btn btn-primary" onClick={handleUpdate}>Save Role</button>
              </div>
              {message && <p className="success-text">{message}</p>}
              {error && <p className="error-text">{error}</p>}
            </div>

            <div className="card">
              <div className="card-header">
                <h3>Existing Admins</h3>
              </div>
              <div className="branch-list">
                {admins.map((a) => {
                  const branchName = branches.find(b => b.id === Number(a.branch_id))?.name;
                  const canteenName = canteens.find(c => c.id === Number(a.canteen_id))?.name;
                  return (
                    <div key={a.id} className="branch-list-item admin-list-item">
                      <div className="admin-info">
                        <span className="admin-name">{a.username}</span>
                        <span className="admin-role muted">({a.role})</span>
                        {branchName && <span className="admin-assignment muted">• Branch: {branchName}</span>}
                        {canteenName && <span className="admin-assignment muted">• Canteen: {canteenName}</span>}
                      </div>
                      <button className="btn btn-danger" onClick={() => handleDeleteById(a.id)}>Delete</button>
                    </div>
                  );
                })}
                {admins.length === 0 && <div className="branch-list-item muted">No admins found.</div>}
              </div>
            </div>
          </div>
        )}
    </AdminLayout>
  );
};

export default Adminmag;
