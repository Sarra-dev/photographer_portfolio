const BASE =
  import.meta.env.VITE_API_URL ||
  "https://photographer-portfolio-l0yh.onrender.com/api"


async function req(path, options = {}) {

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  })

  if (!res.ok) {
    throw new Error(await res.text())
  }

  return res.json()
}


export const api = {

  // Dashboard
  dashboard: () => req('/dashboard/'),


  // Clients
  getClients: () => req('/clients/'),
  getClient: (id) => req(`/clients/${id}`),

  createClient: (data) =>
    req('/clients/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateClient: (id, data) =>
    req(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteClient: (id) =>
    req(`/clients/${id}`, {
      method: 'DELETE'
    }),



  // Shootings
  getShootings: (status) =>
    req(`/shootings/${status ? `?status=${status}` : ''}`),

  getShooting: (id) =>
    req(`/shootings/${id}`),

  createShooting: (data) =>
    req('/shootings/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateShooting: (id, data) =>
    req(`/shootings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteShooting: (id) =>
    req(`/shootings/${id}`, {
      method: 'DELETE'
    }),



  // Payments
  getPayments: (status) =>
    req(`/payments/${status ? `?status=${status}` : ''}`),

  updatePayment: (id, data) =>
    req(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  markPaid: (id) =>
    req(`/payments/${id}/mark-paid`, {
      method: 'POST'
    }),

  createPayment: (data) =>
    req('/payments/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),



  // Appointments
  getAppointments: (month) =>
    req(`/appointments/${month ? `?month=${month}` : ''}`),

  getCalendar: (month) =>
    req(`/appointments/calendar?month=${month}`),

  createAppointment: (data) =>
    req('/appointments/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateAppointment: (id, data) =>
    req(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteAppointment: (id) =>
    req(`/appointments/${id}`, {
      method: 'DELETE'
    }),
}