import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import './user.css';
import logoImage from '../image/logo.png';
import { API_URL } from '../config/api';

const UserMenu = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { canteenId } = useParams();

  // 👇 READ FROM URL route parameter or query parameter (for backward compatibility)
  const query = new URLSearchParams(location.search);
  const canteenIdFromQR = query.get('canteenId') || query.get('canteen_id');

  // fallback to navigation state (optional)
  const {
    selectedCanteenId: stateCanteenId,
    branchName,
    canteenName
  } = location.state || {};

  // Final canteen ID from any source
  const finalCanteenId = canteenId || canteenIdFromQR || stateCanteenId;

  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [canteenDetails, setCanteenDetails] = useState({
    name: canteenName,
    branchName: branchName,
  });

  useEffect(() => {
    if (!finalCanteenId) {
      setError('Invalid QR or canteen not found');
      setLoading(false);
      return;
    }

    // Fetch menu for the canteen
    fetch(`${API_URL}/menus?canteen_id=${finalCanteenId}`)
      .then(res => res.json())
      .then(data => setMenuItems(Array.isArray(data) ? data : []))
      .catch(() => setError('Failed to load menu'))
      .finally(() => setLoading(false));

    // If names are not available from state (e.g. from QR link), fetch them
    if (!canteenName) {
      const fetchDetails = async () => {
        try {
          const resCanteens = await fetch(`${API_URL}/canteens`);
          if (!resCanteens.ok) throw new Error('Failed to fetch canteens');
          const allCanteens = await resCanteens.json();

          const currentCanteen = allCanteens.find(c => String(c.id) === String(finalCanteenId));
          if (currentCanteen) {
            const resBranches = await fetch(`${API_URL}/branches`);
            if (!resBranches.ok) throw new Error('Failed to fetch branches');
            const allBranches = await resBranches.json();

            const currentBranch = allBranches.find(b => String(b.id) === String(currentCanteen.branch_id));
            setCanteenDetails({
              name: currentCanteen.name,
              branchName: currentBranch ? currentBranch.name : '',
            });
          }
        } catch (err) {
          console.error("Error loading details:", err);
        }
      };
      fetchDetails();
    }
  }, [finalCanteenId, canteenName]);

  const addToCart = (item) => setCart([...cart, item]);

  const removeFromCart = (item) => {
    const index = cart.findIndex(i => i.id === item.id);
    if (index !== -1) {
      const copy = [...cart];
      copy.splice(index, 1);
      setCart(copy);
    }
  };

  const quantity = (id) => cart.filter(i => i.id === id).length;

  return (
    <div className="user-page-wrapper">
      <div className="user-container">
        <header className="user-menu-header">
          <div>
            <h1>{canteenDetails.name || 'Canteen Menu'}</h1>
            {canteenDetails.branchName && <p>Branch: {canteenDetails.branchName}</p>}
          </div>
          <img src={logoImage} alt="Logo" className="user-menu-logo" />
        </header>

        {loading && <p className="muted">Loading...</p>}
        {error && <p className="error-text">{error}</p>}

        <div className="user-menu-grid">
          {menuItems.map(item => {
            const qty = quantity(item.id);
            return (
              <div key={item.id} className="user-menu-item-card">
                <div className="user-menu-item-image">
                  <img src={item.photo} alt={item.name} />
                </div>
                <div className="user-menu-item-content">
                  <div className="user-menu-item-details">
                    <span className="user-menu-item-name">{item.name}</span>
                    <span className="user-menu-item-price">{item.price}</span>
                  </div>
                  {qty > 0 ? (
                    <div className="qty-controls">
                      <button onClick={() => removeFromCart(item)}>-</button>
                      <span>{qty}</span>
                      <button onClick={() => addToCart(item)}>+</button>
                    </div>
                  ) : (
                    <button className="add-btn" onClick={() => addToCart(item)}>Add</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {cart.length > 0 && (
          <div className="user-checkout-fab">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/user-checkout', { state: { 
                cart, 
                branchName: canteenDetails.branchName, 
                canteenName: canteenDetails.name 
              } })}
            >
              <span className="cart-count">{cart.length}</span>
              <span>Checkout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMenu;
