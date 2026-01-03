import React, { useState, useEffect } from 'react';
import './dashboard.css';
import { API_URL } from '../config/api';

const Menus = ({ user }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    photo: '',
    canteen_id: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [canteens, setCanteens] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filterBranch, setFilterBranch] = useState('');
  const [filterCanteen, setFilterCanteen] = useState('');

  // Fetch canteens for the dropdown selector
  useEffect(() => {
    if (user?.role === 'main_admin' || (user?.role === 'branch_admin' && user.branch_id)) {
      let canteensUrl = `${API_URL}/canteens`;
      if (user.role === 'branch_admin') {
        canteensUrl += `?branch_id=${user.branch_id}`;
      }
      fetch(canteensUrl)
        .then(res => res.headers.get('content-type')?.includes('application/json') ? res.json() : [])
        .then(data => setCanteens(Array.isArray(data) ? data : []))
        .catch(err => console.error('Error fetching canteens:', err));
    }
  }, [user]);

  // Fetch branches for main_admin filter
  useEffect(() => {
    if (user?.role === 'main_admin') {
      fetch(`${API_URL}/branches`)
        .then(res => res.headers.get('content-type')?.includes('application/json') ? res.json() : [])
        .then(data => setBranches(Array.isArray(data) ? data : []))
        .catch(err => console.error('Error fetching branches:', err));
    }
  }, [user]);

  useEffect(() => {
    let url = `${API_URL}/menus`;
    // Canteen admin sees only their menu
    if (user?.role === 'canteen_admin' && user.canteen_id) {
      url += `?canteen_id=${user.canteen_id}`;
    } else if (user?.role === 'branch_admin' && user.branch_id) {
      // Branch admin sees menus for all canteens in their branch
      url += `?branch_id=${user.branch_id}`;
    } else if (user?.role === 'canteen_admin' && !user.canteen_id) {
      // Fail-safe: Canteen admin with no canteen_id assigned sees nothing.
      setMenuItems([]);
      return;
    }
    // Main admin sees all menus by default

    fetch(url)
      .then(res => res.headers.get('content-type')?.includes('application/json') ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          let filteredData = data;
          if (user?.role === 'canteen_admin' && user.canteen_id) {
            filteredData = data.filter(item => Number(item.canteen_id) === Number(user.canteen_id));
          }
          setMenuItems(filteredData);
        } else {
          setMenuItems([]);
        }
      })
      .catch(err => console.error('Error fetching menus:', err));
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditClick = (item) => {
    setFormData({
      name: item.name,
      price: item.price,
      photo: item.photo || '',
      canteen_id: item.canteen_id || ''
    });
    setEditingId(item.id);
    setShowForm(true);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', photo: '', canteen_id: '' });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const payload = { ...formData };
    // If canteen admin is adding/editing, force their canteen_id
    if (user?.role === 'canteen_admin') {
      payload.canteen_id = user.canteen_id;
    }
    
    if (editingId) {
      fetch(`${API_URL}/menus/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(res => {
        if (!res.ok) {
          return res.text().then(text => {
            let err;
            try {
              err = JSON.parse(text);
            } catch (e) {
              throw new Error(`Server error (${res.status}): ${text.substring(0, 100)}`);
            }
            throw new Error(err.sqlMessage || err.message || 'Server Error');
          });
        }
        return res.json();
      })
      .then(updatedItem => {
        setMenuItems(prev => prev.map(item => item.id === editingId ? { ...item, ...updatedItem } : item));
        resetForm();
      })
      .catch(err => {
        console.error('Error updating menu item:', err);
        setError(`Failed to update menu item: ${err.message}`);
      });
    } else {
      fetch(`${API_URL}/menus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(res => {
        if (!res.ok) {
          return res.text().then(text => {
            let err;
            try {
              err = JSON.parse(text);
            } catch (e) {
              throw new Error(`Server error (${res.status}): ${text.substring(0, 100)}`);
            }
            throw new Error(err.sqlMessage || err.message || 'Server Error');
          });
        }
        return res.json();
      })
      .then(newItem => {
        setMenuItems([...menuItems, newItem]);
        resetForm();
      })
      .catch(err => {
        console.error('Error adding menu item:', err);
        setError(`Failed to add menu item: ${err.message}`);
      });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      fetch(`${API_URL}/menus/${id}`, {
        method: 'DELETE',
      })
        .then(res => {
          if (res.ok) return res.json();
          return res.text().then(text => { throw new Error(text || 'Failed to delete') });
        })
        .then(() => {
          setMenuItems(prev => prev.filter(item => item.id !== id));
        })
        .catch(err => {
          console.error('Error deleting menu item:', err);
          alert('Failed to delete item. Check console for details.');
        });
    }
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (user?.role === 'main_admin') {
      if (!filterBranch || !filterCanteen) return false;

      const canteen = canteens.find(c => Number(c.id) === Number(item.canteen_id));
      if (!canteen || Number(canteen.branch_id) !== Number(filterBranch)) {
        return false;
      }
      
      if (Number(item.canteen_id) !== Number(filterCanteen)) {
        return false;
      }
    }
    
    return true;
  });

  // Helper to display price with ₹ symbol, but avoid double ₹ if user enters "₹100"
  const formatRupee = (price) => {
    if (typeof price !== 'string' && typeof price !== 'number') return '';
    // Remove any existing rupee symbol and whitespace
    const priceStr = String(price).replace(/[\s₹]/g, '');
    return `₹${priceStr}`;
  };

  return (
    <div className="menus-container">
      {/* Left Sidebar: Filters and Form */}
      <div className="menus-left-sidebar">
        <div className="card">
          <div className="card-header">
            <h3>Filters & Options</h3>
          </div>

          {/* Branch and Canteen Selection */}
          {user?.role === 'main_admin' && (
            <div className="menus-filters-section">
              <div className="form-group">
                <label className="form-label">Select Branch</label>
                <select 
                  className="form-select" 
                  value={filterBranch}
                  onChange={(e) => {
                    setFilterBranch(e.target.value);
                    setFilterCanteen('');
                  }}
                >
                  <option value="">Select Branch</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select Canteen</label>
                <select 
                  className="form-select" 
                  value={filterCanteen}
                  onChange={(e) => setFilterCanteen(e.target.value)}
                >
                  <option value="">Select Canteen</option>
                  {canteens
                    .filter(c => !filterBranch || Number(c.branch_id) === Number(filterBranch))
                    .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <button 
                className="btn btn-primary" 
                onClick={() => {
                  if (showForm) {
                    resetForm();
                  } else {
                    setShowForm(true);
                  }
                }}
                style={{ width: '100%' }}
              >
                {showForm ? 'Cancel' : 'Add Item'}
              </button>
            </div>
          )}

          {/* Add/Edit Form */}
          {showForm && (
            <div className="menu-form">
              <h4 style={{ marginBottom: '1rem' }}>{editingId ? 'Edit Menu Item' : 'Add New Menu Item'}</h4>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Item Name</label>
                  <input className="form-input" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Price (e.g. ₹120)</label>
                  <input className="form-input" name="price" value={formData.price} onChange={handleChange} required />
                </div>
                {(user?.role === 'main_admin' || user?.role === 'branch_admin') && (
                  <div className="form-group">
                    <label className="form-label">Canteen</label>
                    <select className="form-select" name="canteen_id" value={formData.canteen_id} onChange={handleChange} required>
                      <option value="">-- Select Canteen --</option>
                      {canteens.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Item Image</label>
                  <input type="file" className="form-input" accept="image/*" onChange={handleFileChange} required={!formData.photo} />
                  {formData.photo && (
                    <div className="menu-form-preview">
                      <img src={formData.photo} alt="Preview" />
                    </div>
                  )}
                </div>
                {error && <p className="text-danger">{error}</p>}
                <div className="menu-form-actions">
                  <button type="button" className="btn btn-secondary" onClick={resetForm} style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingId ? 'Update' : 'Save'}</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Right Content: Menu Items */}
      <div className="menus-right-content">
        <div className="card menus-page-card">
          <div className="card-header">
            <h3>Menu Items</h3>
          </div>

          <div className="menu-list">
            {filteredMenuItems.length === 0 ? (
              <p className="empty-state">No menu items found. {user?.role === 'main_admin' && 'Select a branch and canteen to view items.'}</p>
            ) : (
              filteredMenuItems.map((item) => (
                <div key={item.id} className="menu-item-card">
                  <div className="menu-item-image">
                    {item.photo ? (
                      <img src={item.photo} alt={item.name} />
                    ) : (
                      <span>No Image</span>
                    )}
                  </div>
                  <div className="menu-item-content">
                    <h4 className="menu-item-name">{item.name}</h4>
                    {user?.role === 'main_admin' && canteens.find(c => c.id === item.canteen_id) && (
                      <p className="menu-item-canteen">{canteens.find(c => c.id === item.canteen_id).name}</p>
                    )}
                    <p className="menu-item-price">{formatRupee(item.price)}</p>
                    <div className="menu-item-actions">
                      <button className="btn btn-secondary" onClick={() => handleEditClick(item)}>Edit</button>
                      <button className="menu-btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menus;