'use server'

import connectToDatabase from '@/lib/mongodb';
import { Event, Booking, IEvent } from '@/database';

export const getSimilarEventsBySlug = async (slug :string): Promise<IEvent[]> => {
  try {
    await connectToDatabase();

    const event = await Event.findOne({ slug })

    if (!event) {
      return []
    }

    const similarEvents = await Event.find({_id: { $ne: event._id}, tags: { $in: event.tags }});
    return JSON.parse(JSON.stringify(similarEvents)); // Convert Mongoose documents to plain objects

  } catch(e) {
    return [];
  }
}

export const getBookingCountBySlug = async (slug: string) => {
  try {
    await connectToDatabase();

    // First find the event by slug to get its ID
    const event = await Event.findOne({ slug });
    if (!event) {
      return 0;
    }

    // Count bookings for this event
    const count = await Booking.countDocuments({ eventId: event._id });
    return count;
 } catch (e) {
    console.error('Error fetching booking count:', e);
    return 0; // Return 0 in case of error
  }
}