import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import { Plus, X, Pencil, Trash2, MapPin, Camera } from 'lucide-react'

const emptyForm = {
  client_id:'', title:'', location:'', shoot_date:'', shoot_time:'',
  duration_hours:2, status:'scheduled', notes:'',
  amount:'', due_date:'', payment_method:'cash'
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-TN', { day:'2-digit', month:'short', year:'numeric' }) : '—'
const fmtTime = (t) => t ? t.slice(0,5) : ''
const fmt     = (n) => Number(n||0).toLocaleString('fr-TN')

const statusBadge = { scheduled:'badge-scheduled', completed:'badge-completed', in_progress:'badge-in_progress', cancelled:'badge-cancelled' }
const payBadge    = { paid:'badge-paid', pending:'badge-pending', overdue:'badge-overdue', partial:'badge-partial' }

const FILTERS = [
  { label:'Tous', value:'' },
  { label:'À venir', value:'scheduled' },
  { label:'Terminés', value:'completed' },
  { label:'Annulés', value:'cancelled' },
]

export default function Shootings() {
  const [shootings, setShootings] = useState([])
  const [clients,   setClients]   = useState([])
  const [filter,    setFilter]    = useState('')
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(null)
  const [form,      setForm]      = useState(emptyForm)
  const [editId,    setEditId]    = useState(null)
  const [saving,    setSaving]    = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [s, c] = await Promise.all([api.getShootings(filter), api.getClients()])
      setShootings(s); setClients(c)
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  const openCreate = () => { setForm(emptyForm); setEditId(null); setModal('form') }
  const openEdit   = (s) => {
    setForm({
      client_id: s.client_id, title: s.title, location: s.location||'',
      shoot_date: s.shoot_date?.slice(0,10)||'', shoot_time: s.shoot_time?.slice(0,5)||'',
      duration_hours: s.duration_hours, status: s.status, notes: s.notes||'',
      amount: s.amount||'', due_date:'', payment_method:'cash'
    })
    setEditId(s.id); setModal('form')
  }

  const save = async () => {
    if (!form.client_id || !form.title || !form.shoot_date) return alert('Remplissez les champs obligatoires.')
    setSaving(true)
    try {
      if (editId) await api.updateShooting(editId, form)
      else        await api.createShooting(form)
      setModal(null); await load()
    } catch(e) { alert(e.message) }
    setSaving(false)
  }

  const del = async (id) => {
    if (!confirm('Supprimer ce shooting ?')) return
    await api.deleteShooting(id); await load()
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">Shootings</h2>
          <p className="page-subtitle">Toutes les sessions photo</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Nouveau shooting</button>
      </div>

      <div className="page-body">
        {/* Filter tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`btn btn-sm ${filter === f.value ? 'btn-primary' : 'btn-ghost'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {loading
          ? <div className="loading">Chargement…</div>
          : shootings.length === 0
          ? <div className="empty-state"><Camera size={40} style={{opacity:.2, marginBottom:12}} /><div>Aucun shooting trouvé.</div></div>
          : <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Session</th><th>Client</th><th>Date</th><th>Lieu</th><th>Durée</th><th>Paiement</th><th>Statut</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {shootings.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight:600, color:'var(--text-dark)' }}>{s.title}</div>
                        {s.notes && <div style={{ fontSize:'0.73rem', color:'var(--text-muted)', marginTop:2 }}>{s.notes.slice(0,55)}{s.notes.length>55?'…':''}</div>}
                      </td>
                      <td style={{ color:'var(--text-mid)' }}>{s.client_name}</td>
                      <td>
                        <div style={{ color:'var(--coral)', fontWeight:600, fontSize:'0.84rem' }}>{fmtDate(s.shoot_date)}</div>
                        {s.shoot_time && <div style={{ fontSize:'0.73rem', color:'var(--text-muted)' }}>{fmtTime(s.shoot_time)}</div>}
                      </td>
                      <td style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>
                        {s.location ? <span style={{display:'flex',alignItems:'center',gap:4}}><MapPin size={11} color="var(--azure)"/>{s.location}</span> : '—'}
                      </td>
                      <td style={{ color:'var(--text-muted)', fontSize:'0.82rem' }}>{s.duration_hours}h</td>
                      <td>
                        {s.amount ? <>
                          <div style={{ fontWeight:700, fontSize:'0.85rem' }}>{fmt(s.amount)} TND</div>
                          {s.payment_status && <span className={`badge ${payBadge[s.payment_status]||'badge-pending'}`} style={{fontSize:'0.64rem'}}>{s.payment_status}</span>}
                        </> : <span style={{color:'var(--text-muted)',fontSize:'0.8rem'}}>—</span>}
                      </td>
                      <td><span className={`badge ${statusBadge[s.status]||'badge-scheduled'}`}>{s.status}</span></td>
                      <td>
                        <div style={{ display:'flex', gap:5 }}>
                          <button className="btn btn-ghost btn-xs" onClick={() => openEdit(s)}><Pencil size={13}/></button>
                          <button className="btn btn-danger btn-xs" onClick={() => del(s.id)}><Trash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>

      {modal === 'form' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth:640 }}>
            <div className="modal-header">
              <span className="modal-title">{editId ? 'Modifier shooting' : 'Nouveau shooting'}</span>
              <button className="modal-close" onClick={() => setModal(null)}><X size={18}/></button>
            </div>
            <div className="form-grid" style={{ gap:14 }}>
              <div className="field">
                <label>Client *</label>
                <select value={form.client_id} onChange={e => setForm({...form, client_id:e.target.value})}>
                  <option value="">— Sélectionner un client —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company?` · ${c.company}`:''}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Titre de la session *</label>
                <input value={form.title} onChange={e => setForm({...form, title:e.target.value})} placeholder="ex: Shooting menu été 2025" />
              </div>
              <div className="form-grid form-grid-2">
                <div className="field">
                  <label>Date *</label>
                  <input type="date" value={form.shoot_date} onChange={e => setForm({...form, shoot_date:e.target.value})} />
                </div>
                <div className="field">
                  <label>Heure</label>
                  <input type="time" value={form.shoot_time} onChange={e => setForm({...form, shoot_time:e.target.value})} />
                </div>
                <div className="field">
                  <label>Lieu</label>
                  <input value={form.location} onChange={e => setForm({...form, location:e.target.value})} placeholder="Plage, restaurant…" />
                </div>
                <div className="field">
                  <label>Durée (heures)</label>
                  <input type="number" step="0.5" min="0.5" value={form.duration_hours} onChange={e => setForm({...form, duration_hours:e.target.value})} />
                </div>
                <div className="field">
                  <label>Statut</label>
                  <select value={form.status} onChange={e => setForm({...form, status:e.target.value})}>
                    <option value="scheduled">Planifié</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Terminé</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </div>
              </div>

              <div className="divider" />
              <div style={{ fontSize:'0.73rem', color:'var(--sun)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.09em' }}>
                Paiement associé {editId && '(non modifiable ici)'}
              </div>
              {!editId && (
                <div className="form-grid form-grid-2">
                  <div className="field">
                    <label>Montant (TND)</label>
                    <input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount:e.target.value})} placeholder="0.00" />
                  </div>
                  <div className="field">
                    <label>Échéance</label>
                    <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date:e.target.value})} />
                  </div>
                  <div className="field">
                    <label>Mode de paiement</label>
                    <select value={form.payment_method} onChange={e => setForm({...form, payment_method:e.target.value})}>
                      <option value="cash">Espèces</option>
                      <option value="bank_transfer">Virement</option>
                      <option value="card">Carte</option>
                      <option value="cheque">Chèque</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="field">
                <label>Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes:e.target.value})} placeholder="Instructions, style, références…" rows={3} />
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setModal(null)}>Annuler</button>
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? 'Enregistrement…' : editId ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}