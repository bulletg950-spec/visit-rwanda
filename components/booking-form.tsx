'use client'

import { useState } from 'react'

type Tour = { id: string; name: string }

export function BookingForm({ tours }: { tours: Tour[] }) {
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setStatus(null)
    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(form)) })
    const data = await response.json()
    setBusy(false)
    setStatus(data.message ?? data.error)
    if (response.ok) event.currentTarget.reset()
  }

  return <form onSubmit={submit} className="booking-form">
    <div className="form-grid">
      <label>Choose an experience<select name="tourId" required defaultValue=""><option value="" disabled>Select a tour</option>{tours.map((tour) => <option key={tour.id} value={tour.id}>{tour.name}</option>)}</select></label>
      <label>Travel date<input name="travelDate" type="date" required min={new Date().toISOString().slice(0, 10)} /></label>
      <label>Your name<input name="fullName" placeholder="Aline Uwimana" required /></label>
      <label>Email address<input name="email" type="email" placeholder="you@example.com" required /></label>
      <label>Travelers<input name="travelers" type="number" min="1" max="20" defaultValue="2" required /></label>
      <label className="wide">Anything we should know?<textarea name="notes" rows={3} placeholder="Dietary needs, interests, or special requests" /></label>
    </div>
    <button disabled={busy} type="submit">{busy ? 'Sending request…' : 'Plan my Rwanda journey'}</button>
    {status && <p className="form-status" role="status">{status}</p>}
  </form>
}
