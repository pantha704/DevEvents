'use server'

import { Booking, Event } from "@/database"
import connectToDatabase from "../mongodb"


export const createBooking = async ({ slug, email }: { slug: string, email: string }) => {
  try {
    // Input validation
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: { message: 'Invalid email format' } };
    }

    // Sanitize and validate slug
    if (!slug || typeof slug !== 'string') {
      return { success: false, error: { message: 'Invalid slug' } };
    }

    // Additional slug validation to ensure it contains only allowed characters
    const slugRegex = /^[a-zA-Z0-9-_]+$/;
    if (!slugRegex.test(slug)) {
      return { success: false, error: { message: 'Invalid slug format' } };
    }

    await connectToDatabase()

    // Find the event by slug to get the event ObjectId
    const event = await Event.findOne({ slug });
    if (!event) {
      return { success: false, error: { message: 'Event not found' } };
    }

    // Check if a booking already exists for this event and email to prevent duplicates
    const existingBooking = await Booking.findOne({
      eventId: event._id,
      email: email.toLowerCase().trim()
    });

    if (existingBooking) {
      return { success: false, error: { message: 'Booking already exists for this event and email' } };
    }

    await Booking.create({
      eventId: event._id,
      email: email.toLowerCase().trim() // Store email in lowercase for consistency
    });

    console.log("Booking Created!");
    return { success: true }
  } catch (e) {
    console.error('create booking failed', e)
    // Return sanitized error message to prevent leaking sensitive information
    return {
      success: false,
      error: { message: 'Internal server error' }
    }
  }
}