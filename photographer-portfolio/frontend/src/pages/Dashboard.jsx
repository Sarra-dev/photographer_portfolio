import React, { useEffect, useState, useCallback } from 'react'
import { api } from '../api.js'
import { Camera, Users, TrendingUp, AlertCircle, Clock, RefreshCw, Wallet, CalendarCheck } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const fmt     = (n) => Number(n || 0).toLocaleString('fr-TN', { minimumFractionDigits: 0 })
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short' }) : '—'
const fmtTime = (t) => t ? t.slice(0, 5) : ''

const statusClass = (s) => ({
  paid: 'badge-paid', pending: 'badge-pending',
  overdue: 'badge-overdue', partial: 'badge-partial',
  scheduled: 'badge-scheduled', completed: 'badge-completed',
}[s] || 'badge-pending')

const PIE_COLORS = {
  paid: '#0E7D5C', pending: '#A06B00',
  overdue: '#C0392B', partial: '#6B3FA0'
}

export default function Dashboard() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const load = useCallback(async () => {
    try {
      setData(await api.dashboard())
      setLastRefresh(new Date())
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    load()
    const iv = setInterval(load, 30000)
    return () => clearInterval(iv)
  }, [load])

  if (loading) return (
    <div className="loading">
      <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
      Chargement…
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (!data) return <div className="empty-state">Erreur de chargement.</div>

  const { revenue, shoots, clients, upcoming_shoots, unpaid_payments, today_appointments, payment_breakdown } = data

  const pieData = (payment_breakdown || []).map(r => ({
    name: r.status, value: parseFloat(r.total), count: r.count,
  }))

  const isOverdue = (p) => p.due_date && new Date(p.due_date) < new Date() && p.status !== 'paid'

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">Bonjour ☀️</h2>
          <p className="page-subtitle">
            Mis à jour à {lastRefresh.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' })} · Auto-refresh toutes les 30s
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      <div className="page-body">

        {/* ── KPIs ── */}
        <div className="kpi-grid">
          <div className="kpi-card sun">
            <div className="kpi-icon sun"><TrendingUp size={18} /></div>
            <div className="kpi-label">Revenus totaux</div>
            <div className="kpi-value">{fmt(revenue?.total_revenue)}<span className="kpi-unit"> TND</span></div>
            <div className="kpi-sub">Collecté : {fmt(revenue?.collected)} TND</div>
          </div>

          <div className="kpi-card warning">
            <div className="kpi-icon warning"><Wallet size={18} /></div>
            <div className="kpi-label">En attente</div>
            <div className="kpi-value">{fmt(revenue?.outstanding)}<span className="kpi-unit"> TND</span></div>
            <div className="kpi-sub">{(unpaid_payments || []).length} paiement(s) impayé(s)</div>
          </div>

          <div className="kpi-card azure">
            <div className="kpi-icon azure"><Camera size={18} /></div>
            <div className="kpi-label">Shootings</div>
            <div className="kpi-value">{shoots?.total || 0}</div>
            <div className="kpi-sub">{shoots?.upcoming || 0} à venir · {shoots?.completed || 0} terminés</div>
          </div>

          <div className="kpi-card coral">
            <div className="kpi-icon coral"><Users size={18} /></div>
            <div className="kpi-label">Clients</div>
            <div className="kpi-value">{clients?.total || 0}</div>
            <div className="kpi-sub">Clients actifs</div>
          </div>
        </div>

        {/* ── Mid row ── */}
        <div className="section-row" style={{ marginBottom: 24 }}>

          {/* Upcoming shoots */}
          <div className="card">
            <div className="card-title">
              <CalendarCheck size={13} /> Prochains shootings
            </div>
            {(upcoming_shoots || []).length === 0
              ? <div className="empty-state" style={{ padding: '24px 0' }}>Aucun shooting à venir</div>
              : (upcoming_shoots || []).map(s => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 0', borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: 'linear-gradient(135deg,#FFF3D6,#FFE8CC)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Camera size={17} color="var(--sun)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 500, color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>{s.client_name}{s.location ? ` · ${s.location}` : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--coral)' }}>{fmtDate(s.shoot_date)}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{fmtTime(s.shoot_time)}</div>
                  </div>
                </div>
              ))
            }
          </div>

          {/* Pie chart */}
          <div className="card">
            <div className="card-title">Répartition paiements</div>
            {pieData.length > 0 ? <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                    paddingAngle={3} dataKey="value">
                    {pieData.map((e, i) => (
                      <Cell key={i} fill={PIE_COLORS[e.name] || '#8A9BAA'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => `${fmt(v)} TND`}
                    contentStyle={{
                      background: '#fff', border: '1px solid var(--border)',
                      borderRadius: 10, fontSize: '0.8rem', color: 'var(--text-dark)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 6 }}>
                {pieData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'var(--text-mid)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[d.name] || '#8A9BAA' }} />
                    {d.name} ({d.count})
                  </div>
                ))}
              </div>
            </> : <div className="empty-state" style={{ padding: '24px 0' }}>Pas de données</div>}
          </div>
        </div>

        {/* ── Unpaid table ── */}
        <div className="card" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--border)' }}>
            <div className="card-title" style={{ marginBottom: 0 }}>
              <AlertCircle size={13} /> Paiements en attente
            </div>
          </div>
          {(unpaid_payments || []).length === 0
            ? <div className="empty-state">Tous les paiements sont à jour ✓</div>
            : <table className="data-table">
                <thead>
                  <tr>
                    <th>Client</th><th>Shooting</th><th>Montant</th><th>Échéance</th><th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {(unpaid_payments || []).map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{p.client_name}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{p.shooting_title}</td>
                      <td style={{ fontWeight: 700 }}>{fmt(p.amount)} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{p.currency}</span></td>
                      <td style={{ color: isOverdue(p) ? 'var(--coral)' : 'var(--text-muted)', fontWeight: isOverdue(p) ? 600 : 400, fontSize: '0.83rem' }}>
                        {fmtDate(p.due_date)}{isOverdue(p) && <span style={{ fontSize: '0.65rem', display: 'block', color: 'var(--coral)' }}>En retard</span>}
                      </td>
                      <td><span className={`badge ${statusClass(p.status)}`}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>

        {/* ── Today agenda ── */}
        <div className="card">
          <div className="card-title"><Clock size={13} /> Aujourd'hui</div>
          {(today_appointments || []).length === 0
            ? <div className="empty-state" style={{ padding: '20px 0' }}>Aucun rendez-vous aujourd'hui</div>
            : (today_appointments || []).map(a => (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0', borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--azure)', fontWeight: 600, width: 44, flexShrink: 0 }}>{fmtTime(a.appointment_time)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 500 }}>{a.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>{a.client_name} · {a.type}</div>
                </div>
                <span className={`badge ${statusClass(a.status)}`}>{a.status}</span>
              </div>
            ))
          }
        </div>

      </div>
    </>
  )
}