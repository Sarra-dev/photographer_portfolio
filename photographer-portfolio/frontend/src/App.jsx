import React from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Camera, CreditCard, CalendarDays } from 'lucide-react'

import Dashboard from './pages/Dashboard.jsx'
import Clients from './pages/Clients.jsx'
import Shootings from './pages/Shootings.jsx'
import Payments from './pages/Payments.jsx'
import Calendar from './pages/Calendar.jsx'

const navItems = [
  { to: '/',           label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/clients',    label: 'Clients',      icon: Users },
  { to: '/shootings',  label: 'Shootings',    icon: Camera },
  { to: '/payments',   label: 'Paiements',    icon: CreditCard },
  { to: '/calendar',   label: 'Calendrier',   icon: CalendarDays },
]

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="tide-bar" />
      <div className="sidebar-logo">
        <h1>Coastal Studio</h1>
        <span>Beach Restaurant Photography</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-soft)' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Studio Manager<br />
          <span style={{ color: 'var(--coral)', fontSize: '0.68rem' }}>v1.0 · 2025</span>
        </div>
      </div>
    </aside>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          <div className="tide-bar" />
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/clients"   element={<Clients />} />
            <Route path="/shootings" element={<Shootings />} />
            <Route path="/payments"  element={<Payments />} />
            <Route path="/calendar"  element={<Calendar />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
