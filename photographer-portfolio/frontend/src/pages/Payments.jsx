import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import { X, CheckCircle, Pencil, CreditCard } from 'lucide-react'

const fmt     = (n) => Number(n||0).toLocaleString('fr-TN', { minimumFractionDigits:2 })
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-TN', { day:'2-digit', month:'short', year:'numeric' }) : '—'

const statusClass = (s) => ({
  paid:'badge-paid', pending:'badge-pending', overdue:'badge-overdue', partial:'badge-partial',
}[s] || 'badge-pending')

const FILTERS = [
  { label:'Tous', value:'' }, { label:'En attente', value:'pending' },
  { label:'Partiel', value:'partial' }, { label:'En retard', value:'overdue' },
  { label:'Payé', value:'paid' },
]

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [filter,   setFilter]   = useState('')
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null)
  const [form,     setForm]     = useState({})
  const [editId,   setEditId]   = useState(null)
  const [saving,   setSaving]   = useState(false)

  const load = async () => {
    setLoading(true)
    try { setPayments(await api.getPayments(filter)) } catch(e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  const openEdit = (p) => {
    setForm({
      amount: p.amount, status: p.status,
      due_date: p.due_date?.slice(0,10)||'',
      paid_date: p.paid_date?.slice(0,10)||'',
      method: p.method||'cash', notes: p.notes||'',
    })
    setEditId(p.id); setModal('edit')
  }

  const markPaid = async (id) => {
    if (!confirm('Marquer comme payé ?')) return
    await api.markPaid(id); await load()
  }

  const save = async () => {
    setSaving(true)
    try { await api.updatePayment(editId, form); setModal(null); await load() }
    catch(e) { alert(e.message) }
    setSaving(false)
  }

  const totalFiltered = payments.reduce((s,p) => s + parseFloat(p.amount||0), 0)
  const totalPaid     = payments.filter(p => p.status==='paid').reduce((s,p) => s + parseFloat(p.amount||0), 0)
  const totalPending  = payments.filter(p => p.status!=='paid').reduce((s,p) => s + parseFloat(p.amount||0), 0)
  const isOverdue     = (p) => p.due_date && new Date(p.due_date) < new Date() && p.status !== 'paid'

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">Paiements</h2>
          <p className="page-subtitle">Suivi financier de tous les clients</p>
        </div>
      </div>

      <div className="page-body">
        {/* Summary KPIs */}
        <div className="kpi-grid" style={{ marginBottom:20 }}>
          <div className="kpi-card sun">
            <div className="kpi-icon sun"><CreditCard size={17}/></div>
            <div className="kpi-label">Total facturé</div>
            <div className="kpi-value">{fmt(totalFiltered)}<span className="kpi-unit"> TND</span></div>
          </div>
          <div className="kpi-card azure">
            <div className="kpi-icon azure"><CheckCircle size={17}/></div>
            <div className="kpi-label">Collecté</div>
            <div className="kpi-value">{fmt(totalPaid)}<span className="kpi-unit"> TND</span></div>
          </div>
          <div className="kpi-card warning">
            <div className="kpi-icon warning"><CreditCard size={17}/></div>
            <div className="kpi-label">Restant dû</div>
            <div className="kpi-value">{fmt(totalPending)}<span className="kpi-unit"> TND</span></div>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`btn btn-sm ${filter===f.value ? 'btn-primary' : 'btn-ghost'}`}>{f.label}</button>
          ))}
        </div>

        {loading
          ? <div className="loading">Chargement…</div>
          : payments.length === 0
          ? <div className="empty-state">Aucun paiement trouvé.</div>
          : <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client</th><th>Shooting</th><th>Montant</th><th>Échéance</th><th>Payé le</th><th>Méthode</th><th>Statut</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight:600 }}>{p.client_name}</td>
                      <td style={{ color:'var(--text-muted)', fontSize:'0.82rem', maxWidth:160 }}>
                        <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.shooting_title}</div>
                      </td>
                      <td style={{ fontWeight:700 }}>{fmt(p.amount)} <span style={{ color:'var(--text-muted)', fontSize:'0.73rem' }}>{p.currency}</span></td>
                      <td style={{ color: isOverdue(p)?'var(--coral)':'var(--text-muted)', fontWeight:isOverdue(p)?600:400, fontSize:'0.83rem' }}>
                        {fmtDate(p.due_date)}
                        {isOverdue(p) && <div style={{ fontSize:'0.66rem', color:'var(--coral)' }}>En retard</div>}
                      </td>
                      <td style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>{fmtDate(p.paid_date)}</td>
                      <td style={{ fontSize:'0.78rem', color:'var(--text-mid)', textTransform:'capitalize' }}>{p.method||'—'}</td>
                      <td><span className={`badge ${statusClass(p.status)}`}>{p.status}</span></td>
                      <td>
                        <div style={{ display:'flex', gap:5 }}>
                          {p.status !== 'paid' && (
                            <button className="btn btn-azure btn-xs" onClick={() => markPaid(p.id)} title="Marquer payé">
                              <CheckCircle size={13}/>
                            </button>
                          )}
                          <button className="btn btn-ghost btn-xs" onClick={() => openEdit(p)}><Pencil size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>

      {modal === 'edit' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Modifier paiement</span>
              <button className="modal-close" onClick={() => setModal(null)}><X size={18}/></button>
            </div>
            <div className="form-grid" style={{ gap:14 }}>
              <div className="form-grid form-grid-2">
                <div className="field">
                  <label>Montant (TND)</label>
                  <input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount:e.target.value})} />
                </div>
                <div className="field">
                  <label>Statut</label>
                  <select value={form.status} onChange={e => setForm({...form, status:e.target.value})}>
                    <option value="pending">En attente</option>
                    <option value="partial">Partiel</option>
                    <option value="paid">Payé</option>
                    <option value="overdue">En retard</option>
                  </select>
                </div>
                <div className="field">
                  <label>Date d'échéance</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date:e.target.value})} />
                </div>
                <div className="field">
                  <label>Date de paiement</label>
                  <input type="date" value={form.paid_date} onChange={e => setForm({...form, paid_date:e.target.value})} />
                </div>
                <div className="field">
                  <label>Méthode</label>
                  <select value={form.method} onChange={e => setForm({...form, method:e.target.value})}>
                    <option value="cash">Espèces</option>
                    <option value="bank_transfer">Virement</option>
                    <option value="card">Carte</option>
                    <option value="cheque">Chèque</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes:e.target.value})} rows={2} placeholder="Remarques…" />
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setModal(null)}>Annuler</button>
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? 'Enregistrement…' : 'Mettre à jour'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}