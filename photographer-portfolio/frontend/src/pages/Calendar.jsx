import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import { ChevronLeft, ChevronRight, Plus, X, Camera } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
         addDays, addMonths, subMonths, isSameMonth, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'

const emptyAppt = { client_id:'', title:'', appointment_date:'', appointment_time:'', duration_minutes:60, type:'meeting', status:'scheduled', notes:'' }

const typeColors = {
  shooting:  { bg:'#FFF3D6', border:'#F5A623', text:'#A06B00' },
  meeting:   { bg:'#E0F3FF', border:'#1B8ECA', text:'#0E5E8A' },
  call:      { bg:'#EEE6FF', border:'#8B5CF6', text:'#6B3FA0' },
  delivery:  { bg:'#E3F7F0', border:'#10B981', text:'#0E7D5C' },
  revision:  { bg:'#FFF0EB', border:'#F46B45', text:'#C0481A' },
  other:     { bg:'#F2F4F6', border:'#8A9BAA', text:'#4A6070' },
}

const WEEKDAYS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

export default function Calendar() {
  const [current, setCurrent]   = useState(new Date())
  const [events,  setEvents]    = useState([])
  const [clients, setClients]   = useState([])
  const [selected, setSelected] = useState(null)
  const [modal,   setModal]     = useState(null)
  const [form,    setForm]      = useState(emptyAppt)
  const [saving,  setSaving]    = useState(false)
  const [editAppt, setEditAppt] = useState(null)

  const monthKey = format(current, 'yyyy-MM')

  const load = async () => {
    try {
      const [ev, cl] = await Promise.all([api.getCalendar(monthKey), api.getClients()])
      setEvents(ev); setClients(cl)
    } catch(e) { console.error(e) }
  }

  useEffect(() => { load() }, [monthKey])

  const monthStart = startOfMonth(current)
  const monthEnd   = endOfMonth(current)
  const gridStart  = startOfWeek(monthStart, { weekStartsOn:1 })
  const gridEnd    = endOfWeek(monthEnd, { weekStartsOn:1 })

  const days = []
  let d = gridStart
  while (d <= gridEnd) { days.push(d); d = addDays(d,1) }

  const eventsForDay = (day) =>
    events.filter(e => e.event_date?.slice(0,10) === format(day,'yyyy-MM-dd'))

  const openCreate = (day) => {
    setForm({ ...emptyAppt, appointment_date: format(day,'yyyy-MM-dd') })
    setEditAppt(null); setModal('form')
  }

  const openEditAppt = (appt) => {
    setForm({
      client_id: appt.client_id||'', title: appt.title,
      appointment_date: appt.event_date?.slice(0,10)||'',
      appointment_time: appt.event_time?.slice(0,5)||'',
      duration_minutes: appt.duration_minutes||60,
      type: appt.type||'meeting', status: appt.status||'scheduled', notes: appt.notes||'',
    })
    setEditAppt(appt.id); setModal('form')
  }

  const save = async () => {
    if (!form.title||!form.appointment_date) return alert('Titre et date requis.')
    setSaving(true)
    try {
      if (editAppt) await api.updateAppointment(editAppt, form)
      else          await api.createAppointment(form)
      setModal(null); await load()
    } catch(e) { alert(e.message) }
    setSaving(false)
  }

  const deleteAppt = async (id) => {
    if (!confirm('Supprimer ce rendez-vous ?')) return
    await api.deleteAppointment(id); await load()
  }

  const selectedEvents = selected ? eventsForDay(selected) : []

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">Calendrier</h2>
          <p className="page-subtitle">Shootings et rendez-vous</p>
        </div>
        <button className="btn btn-primary" onClick={() => openCreate(new Date())}>
          <Plus size={16}/> Nouveau RDV
        </button>
      </div>

      <div className="page-body">
        <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 290px' : '1fr', gap:20 }}>

          {/* Calendar grid */}
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            {/* Month nav */}
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'16px 20px', borderBottom:'1px solid var(--border)',
              background:'var(--sand)',
            }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setCurrent(subMonths(current,1))}>
                <ChevronLeft size={16}/>
              </button>
              <span style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', color:'var(--text-dark)', fontWeight:700, textTransform:'capitalize' }}>
                {format(current,'MMMM yyyy',{locale:fr})}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => setCurrent(addMonths(current,1))}>
                <ChevronRight size={16}/>
              </button>
            </div>

            {/* Weekday headers */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', background:'var(--sand)', borderBottom:'1px solid var(--border)' }}>
              {WEEKDAYS.map(w => (
                <div key={w} style={{ textAlign:'center', padding:'8px 0', fontSize:'0.7rem', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.09em' }}>
                  {w}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
              {days.map((day, i) => {
                const dayEvents = eventsForDay(day)
                const inMonth   = isSameMonth(day, current)
                const isToday   = isSameDay(day, new Date())
                const isSel     = selected && isSameDay(day, selected)

                return (
                  <div key={i} onClick={() => setSelected(isSel ? null : day)} style={{
                    minHeight:88, padding:'7px 6px',
                    borderRight: (i+1)%7!==0 ? '1px solid var(--border)' : 'none',
                    borderBottom: '1px solid var(--border)',
                    cursor:'pointer',
                    background: isSel ? '#FFF3D6' : isToday ? '#E0F8F5' : inMonth ? '#fff' : '#FAFAF8',
                    transition:'background 0.12s',
                  }}>
                    <div style={{ marginBottom:4 }}>
                      <span style={{
                        display:'inline-flex', alignItems:'center', justifyContent:'center',
                        width:22, height:22, borderRadius:'50%',
                        background: isToday ? 'var(--azure)' : 'transparent',
                        color: isToday ? '#fff' : !inMonth ? 'var(--text-muted)' : 'var(--text-dark)',
                        fontSize:'0.78rem', fontWeight: isToday ? 700 : 400,
                      }}>{format(day,'d')}</span>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                      {dayEvents.slice(0,3).map((ev,j) => {
                        const color = typeColors[ev.event_type]||typeColors.other
                        return (
                          <div key={j} style={{
                            fontSize:'0.67rem', fontWeight:500,
                            color: color.text,
                            background: color.bg,
                            borderLeft:`2.5px solid ${color.border}`,
                            padding:'1px 5px', borderRadius:'0 4px 4px 0',
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                          }}>
                            {ev.event_time?.slice(0,5) && <span style={{marginRight:3,opacity:0.7}}>{ev.event_time.slice(0,5)}</span>}
                            {ev.title}
                          </div>
                        )
                      })}
                      {dayEvents.length > 3 && <div style={{ fontSize:'0.63rem', color:'var(--text-muted)', paddingLeft:2 }}>+{dayEvents.length-3}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Day detail panel */}
          {selected && (
            <div className="card" style={{ alignSelf:'start', position:'sticky', top:24 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:'1rem', fontWeight:700, color:'var(--text-dark)', textTransform:'capitalize' }}>
                    {format(selected,'EEEE d MMM',{locale:fr})}
                  </div>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{selectedEvents.length} événement(s)</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => openCreate(selected)}><Plus size={13}/></button>
              </div>

              {selectedEvents.length === 0
                ? <div style={{ textAlign:'center', padding:'28px 0', color:'var(--text-muted)', fontSize:'0.82rem' }}>
                    <CalendarDays size={28} style={{opacity:.2, marginBottom:8}} />
                    <div>Aucun événement</div>
                  </div>
                : selectedEvents.map((ev,i) => {
                    const color = typeColors[ev.event_type]||typeColors.other
                    return (
                      <div key={i} style={{
                        borderLeft:`3px solid ${color.border}`,
                        paddingLeft:12, marginBottom:14,
                        paddingBottom:14,
                        borderBottom: i<selectedEvents.length-1 ? '1px solid var(--border)' : 'none',
                      }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:3 }}>
                          <span style={{ fontSize:'0.72rem', color:color.text, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em' }}>
                            {ev.event_type === 'shooting' ? '📷 Shooting' : ev.type||'RDV'}
                          </span>
                          {ev.event_time && <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{ev.event_time.slice(0,5)}</span>}
                        </div>
                        <div style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--text-dark)', marginBottom:2 }}>{ev.title}</div>
                        {ev.client_name && <div style={{ fontSize:'0.76rem', color:'var(--text-mid)' }}>{ev.client_name}</div>}
                        {ev.location && <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:2 }}>📍 {ev.location}</div>}
                        {ev.event_type === 'appointment' && (
                          <div style={{ display:'flex', gap:6, marginTop:10 }}>
                            <button className="btn btn-ghost btn-xs" onClick={() => openEditAppt(ev)}>Modifier</button>
                            <button className="btn btn-danger btn-xs" onClick={() => deleteAppt(ev.id)}>Supprimer</button>
                          </div>
                        )}
                      </div>
                    )
                  })
              }
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{ display:'flex', gap:16, marginTop:16, flexWrap:'wrap' }}>
          {Object.entries(typeColors).map(([type, color]) => (
            <div key={type} style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.73rem', color:'var(--text-muted)' }}>
              <div style={{ width:10, height:10, borderRadius:3, background:color.border }} />
              {type}
            </div>
          ))}
        </div>
      </div>

      {modal === 'form' && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editAppt ? 'Modifier RDV' : 'Nouveau rendez-vous'}</span>
              <button className="modal-close" onClick={() => setModal(null)}><X size={18}/></button>
            </div>
            <div className="form-grid" style={{ gap:14 }}>
              <div className="field">
                <label>Titre *</label>
                <input value={form.title} onChange={e => setForm({...form, title:e.target.value})} placeholder="ex: Appel de brief client" />
              </div>
              <div className="field">
                <label>Client</label>
                <select value={form.client_id} onChange={e => setForm({...form, client_id:e.target.value})}>
                  <option value="">— Sans client —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-grid form-grid-2">
                <div className="field">
                  <label>Date *</label>
                  <input type="date" value={form.appointment_date} onChange={e => setForm({...form, appointment_date:e.target.value})} />
                </div>
                <div className="field">
                  <label>Heure</label>
                  <input type="time" value={form.appointment_time} onChange={e => setForm({...form, appointment_time:e.target.value})} />
                </div>
                <div className="field">
                  <label>Durée (min)</label>
                  <input type="number" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes:e.target.value})} />
                </div>
                <div className="field">
                  <label>Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type:e.target.value})}>
                    <option value="meeting">Réunion</option>
                    <option value="call">Appel</option>
                    <option value="delivery">Livraison</option>
                    <option value="revision">Révision</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
                <div className="field">
                  <label>Statut</label>
                  <select value={form.status} onChange={e => setForm({...form, status:e.target.value})}>
                    <option value="scheduled">Planifié</option>
                    <option value="completed">Terminé</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes:e.target.value})} rows={2} placeholder="Détails…" />
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setModal(null)}>Annuler</button>
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? 'Enregistrement…' : editAppt ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}