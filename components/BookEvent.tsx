'use client'
import React, { useState } from 'react'

interface BookEventProps {
  eventSlug?: string;
}

const BookEvent = ({ eventSlug }: BookEventProps) => {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email format synchronously
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          eventSlug
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || 'Failed to book event');
        return;
      }

      setSubmitted(true);
    } catch (err) {
      setError('Network error. Please try again later.');
      console.error('Booking error:', err);
    } finally {
      setLoading(false);
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

          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

          <button
            type="submit"
            className='button-submit'
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      )}
    </div>
  )
}

export default BookEvent