import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './login.css'; // Reusing login styles

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    user_id: '',
    username: '',
    password: '',
    role: 'branch_admin',
    branch_id: '',
    canteen_id: ''
  });
  const [branches, setBranches] = useState([]);
  const [canteens, setCanteens] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/branches').then(res => res.json()).then(data => setBranches(Array.isArray(data) ? data : [])).catch(err => console.error(err));
    fetch('http://localhost:5000/api/canteens').then(res => res.json()).then(data => setCanteens(Array.isArray(data) ? data : [])).catch(err => console.error(err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'role') {
        updated.branch_id = '';
        updated.canteen_id = '';
      }
      if (name === 'branch_id') {
        updated.canteen_id = '';
      }
      return updated;
    });
  };

  const filteredCanteens = formData.branch_id ? canteens.filter(c => String(c.branch_id) === String(formData.branch_id)) : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    fetch('http://localhost:5000/api/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    .then(res => {
      if (res.ok) return res.json();
      return res.text().then(text => {
        try {
          const errData = JSON.parse(text);
          throw new Error(errData.message || 'Signup failed');
        } catch {
          throw new Error(`Server error: ${res.status}. Check console.`);
        }
      });
    })
    .then(() => {
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    })
    .catch(err => setError(err.message));
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '500px' }}>
        <div className="auth-header">
          <h1>Create Admin Account</h1>
          <p className="muted">Join the team by filling out the details below.</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="user_id">User ID (must be unique)</label>
            <input id="user_id" className="form-input" name="user_id" value={formData.user_id} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input id="username" className="form-input" name="username" value={formData.username} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input id="password" type="password" className="form-input" name="password" value={formData.password} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="role">Role</label>
            <select id="role" className="form-select" name="role" value={formData.role} onChange={handleChange}>
              <option value="branch_admin">Branch Admin</option>
              <option value="canteen_admin">Canteen Admin</option>
              <option value="main_admin">Main Admin</option>
            </select>
          </div>

          {formData.role !== 'main_admin' && (
            <div className="form-group">
              <label className="form-label" htmlFor="branch_id">Assign to Branch</label>
              <select id="branch_id" className="form-select" name="branch_id" value={formData.branch_id} onChange={handleChange} required>
                <option value="">-- Select Branch --</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          {formData.role === 'canteen_admin' && (
            <div className="form-group">
              <label className="form-label" htmlFor="canteen_id">Assign to Canteen</label>
              <select id="canteen_id" className="form-select" name="canteen_id" value={formData.canteen_id} onChange={handleChange} required disabled={!formData.branch_id}>
                <option value="">-- Select Canteen --</option>
                {filteredCanteens.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {error && <p className="error-text">{error}</p>}
          {success && <p className="success-text">{success}</p>}
          
          <button type="submit" className="btn btn-primary">Create Account</button>
        </form>
        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Signup;