import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

const bookingSchema = z.object({
  tourId: z.string().min(1),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  travelDate: z.string().date(),
  travelers: z.coerce.number().int().min(1).max(20),
  notes: z.string().trim().max(1000).optional(),
})

const tourIds = new Set(['volcanoes', 'akagera', 'nyungwe'])

export async function POST(request: Request) {
  try {
    const input = bookingSchema.parse(await request.json())
    const today = new Date().toISOString().slice(0, 10)
    if (input.travelDate < today || !tourIds.has(input.tourId)) {
      return NextResponse.json({ error: 'Please choose a valid tour and future date.' }, { status: 400 })
    }

    const result = await db.execute(sql`
      INSERT INTO public.bookings (tour_id, full_name, email, travel_date, travelers, notes)
      VALUES (${input.tourId}, ${input.fullName}, ${input.email.toLowerCase()}, ${input.travelDate}, ${input.travelers}, ${input.notes ?? null})
      RETURNING id
    `)

    return NextResponse.json({ id: result.rows[0]?.id, message: 'Your request is saved. Our travel team will contact you shortly.' }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Please check the booking details.' }, { status: 400 })
    console.error('[v0] Booking submission failed', error)
    return NextResponse.json({ error: 'We could not save your request. Please try again.' }, { status: 500 })
  }
}
