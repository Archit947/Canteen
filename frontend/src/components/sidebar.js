import { NavLink, useNavigate } from 'react-router-dom';
import './sidebar.css';
import logo from '../image/logo.png';
import {
  FaHome,
  FaShoppingCart,
  FaUtensils,
  FaBuilding,
  FaList,
  FaUserShield,
  FaQrcode,
  FaSignOutAlt
} from 'react-icons/fa';

const Sidebar = ({ role, onLogout, isOpen, onNavigate }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) onLogout();
    if (onNavigate) onNavigate();
    navigate('/login');
  };

  const handleNavigate = (path) => {
    if (onNavigate) onNavigate();
    navigate(path);
  };

  const navItems = [
    {
      key: 'dashboard',
      label: 'Overview',
      path: '/dashboard',
      icon: <FaHome />,
      roles: ['main_admin', 'branch_admin', 'canteen_admin']
    },
    {
      key: 'orders',
      label: 'Orders',
      path: '/orders',
      icon: <FaShoppingCart />,
      roles: ['main_admin', 'branch_admin', 'canteen_admin']
    },
    {
      key: 'canteen',
      label: 'Canteen',
      path: '/canteen',
      icon: <FaUtensils />,
      roles: ['main_admin']
    },
    {
      key: 'branches',
      label: 'Branches',
      path: '/branches',
      icon: <FaBuilding />,
      roles: ['main_admin']
    },
    {
      key: 'menus',
      label: 'Menus',
      path: '/menus',
      icon: <FaList />,
      roles: ['main_admin', 'canteen_admin', 'branch_admin']
    },
    {
      key: 'adminmag',
      label: 'Admin Management',
      path: '/adminmag',
      icon: <FaUserShield />,
      roles: ['main_admin']
    },
    {
      key: 'qr',
      label: 'QR Code',
      path: '/page/qr',
      icon: <FaQrcode />,
      roles: ['main_admin', 'canteen_admin', 'branch_admin']
    },
  ];

  const visibleItems = navItems.filter(
    (item) => role && item.roles.includes(role)
  );

  return (
    
    <>
      {/* OVERLAY (Mobile) */}
      {isOpen && <div className="sidebar-overlay" onClick={onNavigate} />}

      {/* SIDEBAR */}
      <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
        {/* BRAND */}
        <div className="brand">
          <div className="brand-image">
            <img src={logo} alt="logo" />
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="nav">
          {visibleItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              onClick={(e) => {
                e.preventDefault();
                handleNavigate(item.path);
              }}
              className={({ isActive }) =>
                `nav-item nav-button ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* LOGOUT */}
        <div className="nav">
          <button className="nav-item nav-button logout-btn" onClick={handleLogout}>
            <span className="nav-icon">
              <FaSignOutAlt />
            </span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
