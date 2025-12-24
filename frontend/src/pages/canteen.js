import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import "../components/canteen.css";

function CanteenQR({ canteenId }) {
  const [qr, setQr] = useState('');
  const [menuUrl, setMenuUrl] = useState('');

  useEffect(() => {
    fetch(`http://localhost:5000/api/qr/canteen/${canteenId}`)
      .then(res => res.json())
      .then(data => {
        setQr(data.qr);
        setMenuUrl(data.menuUrl);
      });
  }, [canteenId]);

  return (
    <div className="card">
      <h3>Scan to Order</h3>

      {qr && (
        <>
          <img src={qr} alt="Canteen QR Code" />
          <p style={{ fontSize: 12, marginTop: 8 }}>
            {menuUrl}
          </p>
        </>
      )}
    </div>
  );
}

const CanteenPage = ({ user }) => {
  const [branches, setBranches] = useState([]);
  const [canteens, setCanteens] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [canteenName, setCanteenName] = useState("");
  
  // Initialize localUser from prop or localStorage to persist login on refresh
  const [localUser, setLocalUser] = useState(() => {
    if (user) return user;
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      return null;
    }
  });

  useEffect(() => {
    if (user) setLocalUser(user);
  }, [user]);

  useEffect(() => {
    fetch("http://localhost:5000/api/branches")
      .then(res => res.json())
      .then(setBranches);

    fetch("http://localhost:5000/api/canteens")
      .then(res => res.json())
      .then(setCanteens);
  }, []);

  const addCanteen = (e) => {
    e.preventDefault();
    if (!selectedBranch || !canteenName) return;

    fetch("http://localhost:5000/api/canteens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: canteenName,
        branch_id: selectedBranch
      })
    })
      .then(res => res.json())
      .then(newCanteen => {
        setCanteens([...canteens, newCanteen]);
        setCanteenName("");
        setSelectedBranch("");
      });
  };

  const deleteCanteen = (canteenId) => {
    if (!window.confirm("Are you sure you want to delete this canteen?")) return;

    fetch(`http://localhost:5000/api/canteens/${canteenId}`, {
      method: "DELETE"
    })
      .then(res => {
        if (res.ok) {
          setCanteens(canteens.filter(c => c.id !== canteenId));
        } else {
          alert("Failed to delete canteen");
        }
      })
      .catch(err => {
        console.error("Error deleting canteen:", err);
        alert("Error deleting canteen");
      });
  };

  // Filter canteens based on selected filter branch
  const filteredCanteens = filterBranch 
    ? canteens.filter(c => c.branch_id === parseInt(filterBranch))
    : canteens;

  return (
    <AdminLayout user={localUser}>
      {/* HEADER */}
      <div className="canteen-header">
        <h1>Canteens</h1>
        <p>Add new canteens and assign them to branches.</p>
      </div>

      {/* GRID */}
      <div className="canteen-grid">

        {/* ADD CANTEEN */}
        <div className="canteen-card">
          <h3>Add Canteen</h3>

          <form onSubmit={addCanteen} className="canteen-form">
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              required
            >
              <option value="">Select Branch</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Canteen name"
              value={canteenName}
              onChange={e => setCanteenName(e.target.value)}
              required
            />

            <button type="submit">Add</button>
          </form>
        </div>

        {/* CANTEEN LIST */}
        <div className="canteen-card">
          <h3>Canteens</h3>

          <div style={{ marginBottom: '16px' }}>
            <select
              value={filterBranch}
              onChange={e => setFilterBranch(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', cursor: 'pointer' }}
            >
              <option value="">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <table className="canteen-table">
            <thead>
              <tr>
                <th>Canteen</th>
                <th>Branch</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCanteens.map(c => {
                const branch = branches.find(b => b.id === c.branch_id);
                return (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{branch?.name || "-"}</td>
                    <td>
                      <button 
                        onClick={() => deleteCanteen(c.id)}
                        className="delete-btn"
                        style={{ background: '#dc3545', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredCanteens.length === 0 && (
                <tr>
                  <td colSpan="3" className="empty">No canteens added</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </AdminLayout>
  );
};

export default CanteenPage;
