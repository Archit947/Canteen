import React from 'react';
import Menus from '../components/menus';
import AdminLayout from '../components/AdminLayout';
import '../components/menus.css';

const MenusPage = ({ user }) => {
  return (
    <AdminLayout user={user}>
      <header className="page-header">
        <h1>Menus</h1>
        <p className="muted">Manage menu items across all canteens.</p>
      </header>
      <Menus user={user} />
    </AdminLayout>
  );
};

export default MenusPage;
