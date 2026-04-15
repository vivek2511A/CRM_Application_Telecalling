import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useState } from 'react';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 72 : 250;

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div style={{
        flex: 1,
        marginLeft: sidebarWidth,
        transition: 'margin-left 0.3s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        <Header />
        <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
