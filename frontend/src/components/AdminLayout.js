import React, { useState, createContext, useContext } from 'react';
import Sidebar from './sidebar';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within AdminLayout');
  }
  return context;
};

const AdminLayout = ({ user, children, onLogout }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <SidebarContext.Provider value={{ setSidebarOpen, toggleSidebar, isSidebarOpen }}>
      <div className="page-container">
        <Sidebar role={user?.role} isOpen={isSidebarOpen} onNavigate={toggleSidebar} onLogout={onLogout} />
        <div className={`overlay ${isSidebarOpen ? 'is-open' : ''}`} onClick={toggleSidebar}></div>
        <main className="main-content">
          <style>{`
            :root {
              /* Adjust this value if your sidebar's width is different */
              --sidebar-width: 150px; 
            }

            .sidebar {
              position: fixed;
              top: 0;
              left: 0;
              height: 100vh; /* Full viewport height */
              overflow-y: auto; /* Allow sidebar to scroll if its content is long */
              z-index: 1000;
            }

            /* --- DESKTOP STYLES --- */
            @media (min-width: 769px) {
              .main-content {
                /* Add padding to the left to avoid content being hidden by the fixed sidebar */
                padding-left: var(--sidebar-width);
              }
              .sidebar-toggle {
                display: none;
              }
            }

            /* --- MOBILE STYLES --- */
            @media (max-width: 768px) {
              .sidebar {
                /* Hides sidebar off-screen by default on mobile */
                transform: translateX(-100%);
                transition: transform 0.3s ease-in-out;
              }
              .sidebar.is-open {
                transform: translateX(0);
              }
            }
          `}</style>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
};

export default AdminLayout;
