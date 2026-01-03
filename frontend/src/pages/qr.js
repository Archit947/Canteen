import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import QRCode from 'react-qr-code';
import '../components/dashboard.css';
import { API_URL } from '../config/api';

const QRPage = ({ user }) => {
  const [branches, setBranches] = useState([]);
  const [canteens, setCanteens] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedCanteen, setSelectedCanteen] = useState('');
  const [baseUrl, setBaseUrl] = useState(window.location.origin);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchesRes, canteensRes] = await Promise.all([
          fetch(`${API_URL}/branches`),
          fetch(`${API_URL}/canteens`)
        ]);
        const branchesData = await branchesRes.json();
        const canteensData = await canteensRes.json();

        setBranches(Array.isArray(branchesData) ? branchesData : []);
        setCanteens(Array.isArray(canteensData) ? canteensData : []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (baseUrl) {
      // Save the base URL to sessionStorage so checkout page can use it
      sessionStorage.setItem('qrBaseUrl', baseUrl);
    }
  }, [baseUrl]);

  // Generate the URL that the user will visit to order
  const generateQRUrl = (canteenId) => {
    // Uses the configured base URL (can be changed to machine IP or ngrok)
    const origin = baseUrl || window.location.origin;
    // Ensure it's a valid URL format
    if (!origin.startsWith('http://') && !origin.startsWith('https://')) {
      // If not a valid URL, fall back to current origin
      return `${window.location.origin}/menu/${canteenId}`;
    }
    return `${origin.replace(/\/$/, '')}/menu/${canteenId}`;
  };

  const filteredCanteens = canteens.filter(c => {
    if (user?.role === 'canteen_admin') return Number(c.id) === Number(user.canteen_id);
    if (selectedBranch) {
      return Number(c.branch_id) === Number(selectedBranch);
    }
    // If main_admin and no branch selected, show nothing
    return false;
  });

  const downloadQR = () => {
    const svg = document.querySelector("#printable-qr svg");
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width || 256;
      canvas.height = img.height || 256;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `canteen-qr-${selectedCanteen}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const printQR = () => window.print();

  return (
    <AdminLayout user={user}>
      <header className="page-header">
        <h1>Canteen QR Codes</h1>
        <p className="muted">Generate QR codes for customers to scan and order directly.</p>
      </header>

      <div className="card">
        {loading && <p>Loading...</p>}
        
        {!loading && user?.role === 'main_admin' && (
          <div className="form-group" style={{ maxWidth: '300px', marginBottom: '1rem' }}>
            <label className="form-label">Select Branch</label>
            <select 
              className="form-select" 
              value={selectedBranch} 
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                setSelectedCanteen('');
              }}
            >
              <option value="">-- Select Branch --</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        {!loading && (user?.role === 'main_admin' || user?.role === 'branch_admin') && (
          <div className="form-group" style={{ maxWidth: '300px', marginBottom: '2rem' }}>
            <label className="form-label">Select Canteen</label>
            <select 
              className="form-select" 
              value={selectedCanteen} 
              onChange={(e) => setSelectedCanteen(e.target.value)}
              disabled={!selectedBranch && user?.role === 'main_admin'}
            >
              <option value="">-- Select Canteen --</option>
              {filteredCanteens.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {selectedCanteen ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ maxWidth: 700, margin: '0 auto 1rem' }}>
              <label className="form-label">Base URL for scanning (phones)</label>
              <input
                type="text"
                className="form-input"
                value={baseUrl}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow valid URLs or empty string
                  if (value === '' || value.startsWith('http://') || value.startsWith('https://')) {
                    setBaseUrl(value);
                  }
                }}
                placeholder="e.g. http://192.168.1.10:3000 or https://abcd.ngrok.io"
                style={{ width: '100%' }}
              />
              <p className="muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Replace with your machine's LAN IP or an exposed URL so phones can reach the app.
                {!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://') && baseUrl !== '' && (
                  <span style={{ color: 'red' }}> Invalid URL format. Must start with http:// or https://</span>
                )}
              </p>
            </div>
            
            <div id="printable-qr">
              <div style={{ background: 'white', padding: '16px', display: 'inline-block', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <QRCode value={generateQRUrl(selectedCanteen)} size={256} />
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <h3>Scan to Order</h3>
                <p className="muted">
                  {canteens.find(c => String(c.id) === String(selectedCanteen))?.name}
                </p>
                <p className="muted" style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>
                  {generateQRUrl(selectedCanteen)}
                </p>
              </div>
            </div>

            <div className="no-print" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={downloadQR}>Download PNG</button>
              <button className="btn btn-secondary" onClick={printQR}>Print QR</button>
            </div>

            <style>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                .no-print {
                  display: none !important;
                }
                #printable-qr, #printable-qr * {
                  visibility: visible;
                }
                #printable-qr {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  margin-top: 20px;
                }
                .sidebar, .page-header {
                  display: none;
                }
              }
            `}</style>
          </div>
        ) : (
          !loading && <p className="muted">Please select a canteen to generate its QR code.</p>
        )}
      </div>
    </AdminLayout>
  );
};

export default QRPage;
