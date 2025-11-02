'use client'
import { createBooking } from '@/lib/actions/booking.actions';
import posthog from 'posthog-js';
import React, { useState } from 'react'

interface BookEventProps {
  slug: string;
  eventId: string;

}

const BookEvent = ({ eventId, slug }: BookEventProps) => {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Add preventDefault to avoid page refresh

    const { success, error } = await createBooking({ slug, email })

    if (success) {
      setSubmitted(true);
      try {
        posthog.capture('event_booked', { eventId, slug, email })
      } catch (e) {
        console.error("PostHog capture failed:", e);
      }
    } else {
      console.error("Booking creation failed", error)
      try {
        posthog.captureException("Booking creation failed")
      } catch (e) {
        console.error("PostHog captureException failed:", e);
      }
    }
  }

  return (
    <div id="book-event">
      {submitted ? (
        <p className='text-sm'>Thank you for signing up!</p>
      ): (
        <form onSubmit={handleSubmit} >
          <div>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              id='email'
              placeholder='Enter your email address'
              required
            />
          </div>
          <button
            type="submit"
            className='button-submit'
          >
            Submit
          </button>
        </form>
      )}
    </div>
  )
}

export default BookEvent