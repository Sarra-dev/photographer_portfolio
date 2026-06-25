import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import { Plus, X, Pencil, Trash2, Phone, Mail, Building2, Users } from 'lucide-react'

const empty = { name: '', email: '', phone: '', company: '', notes: '' }
const fmt   = (n) => Number(n || 0).toLocaleString('fr-TN', { minimumFractionDigits: 0 })

function Avatar({ name }) {
  const initials = name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()
  const colors = [
    ['#FFF3D6','#A06B00'],['#E0F3FF','#0E5E8A'],['#FFF0EB','#C0481A'],
    ['#E3F7F0','#0E7D5C'],['#EEE6FF','#6B3FA0'],
  ]
  const [bg, fg] = colors[name.charCodeAt(0) % colors.length]
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
      background: bg, color: fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.9rem', fontWeight: 600,
    }}>{initials}</div>
  )
}

export default function Clients() {
  const [clients, setClients]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(null)
  const [form, setForm]         = useState(empty)
  const [editId, setEditId]     = useState(null)
  const [saving, setSaving]     = useState(false)
  const [search, setSearch]     = useState('')

  const load = async () => {
    setLoading(true)
    try { setClients(await api.getClients()) } catch(e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.company || '').toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => { setForm(empty); setEditId(null); setModal('form') }
  const openEdit   = (c) => {
    setForm({ name: c.name, email: c.email||'', phone: c.phone||'', company: c.company||'', notes: c.notes||'' })
    setEditId(c.id); setModal('form')
  }

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editId) await api.updateClient(editId, form)
      else        await api.createClient(form)
      setModal(null); await load()
    } catch(e) { alert(e.message) }
    setSaving(false)
  }

  const del = async (id) => {
    if (!confirm('Supprimer ce client et toutes ses données ?')) return
    await api.deleteClient(id); await load()
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">Clients</h2>
          <p className="page-subtitle">{clients.length} client(s) enregistré(s)</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Nouveau client
        </button>
      </div>

      <div className="page-body">
        {/* Search bar */}
        <div style={{ marginBottom: 20 }}>
          <input
            style={{
              width: '100%', maxWidth: 340, padding: '9px 14px',
              borderRadius: 'var(--r-sm)', border: '1.5px solid var(--border-mid)',
              background: '#fff', fontSize: '0.875rem', color: 'var(--text-dark)',
              outline: 'none', fontFamily: 'var(--font-body)',
            }}
            placeholder="Rechercher un client ou une société…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={e => e.target.style.borderColor = 'var(--sun)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-mid)'}
          />
        </div>

        {loading
          ? <div className="loading">Chargement…</div>
          : filtered.length === 0
          ? <div className="empty-state">
              <Users size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
              <div>Aucun client trouvé.</div>
            </div>
          : <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {filtered.map(c => (
                <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <Avatar name={c.name} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-dark)' }}>{c.name}</div>
                        {c.company && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--coral)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Building2 size={11} />{c.company}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className="btn btn-ghost btn-xs" onClick={() => openEdit(c)}><Pencil size={13} /></button>
                      <button className="btn btn-danger btn-xs" onClick={() => del(c.id)}><Trash2 size={13} /></button>
                    </div>
                  </div>

                  {/* Contact info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                    {c.email && <div style={{ fontSize: '0.8rem', color: 'var(--text-mid)', display: 'flex', gap: 7, alignItems: 'center' }}><Mail size={12} color="var(--azure)" />{c.email}</div>}
                    {c.phone && <div style={{ fontSize: '0.8rem', color: 'var(--text-mid)', display: 'flex', gap: 7, alignItems: 'center' }}><Phone size={12} color="var(--azure)" />{c.phone}</div>}
                  </div>

                  {c.notes && (
                    <div style={{
                      fontSize: '0.77rem', color: 'var(--text-muted)',
                      background: 'var(--sand)', borderRadius: 8, padding: '8px 10px',
                      lineHeight: 1.5, marginBottom: 14,
                    }}>{c.notes}</div>
                  )}

                  {/* Stats bar */}
                  <div style={{
                    display: 'flex', gap: 0,
                    borderTop: '1px solid var(--border)',
                    marginTop: 'auto', paddingTop: 14,
                  }}>
                    {[
                      { label: 'Shootings', value: c.total_shoots || 0, color: 'var(--azure)' },
                      { label: 'Facturé', value: `${fmt(c.total_billed)} TND`, color: 'var(--sun)' },
                      { label: 'Payé', value: `${fmt(c.total_paid)} TND`, color: '#0E7D5C' },
                    ].map((s, i) => (
                      <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
                        <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
        }
      </div>

      {modal === 'form' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editId ? 'Modifier client' : 'Nouveau client'}</span>
              <button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <div className="form-grid">
              <div className="form-grid form-grid-2">
                <div className="field">
                  <label>Nom *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nom complet" />
                </div>
                <div className="field">
                  <label>Société</label>
                  <input value={form.company} onChange={e => setForm({...form, company: e.target.value})} placeholder="Restaurant, établissement…" />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@exemple.com" />
                </div>
                <div className="field">
                  <label>Téléphone</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+216 XX XXX XXX" />
                </div>
              </div>
              <div className="field">
                <label>Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Préférences, infos utiles…" rows={3} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button className="btn btn-ghost" onClick={() => setModal(null)}>Annuler</button>
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? 'Enregistrement…' : editId ? 'Mettre à jour' : 'Créer le client'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}