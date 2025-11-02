'use server'

import connectToDatabase from '@/lib/mongodb';
import { Event } from '@/database';

export const getSimilarEventsBySlug = async (slug :string) => {
  try {
    await connectToDatabase();

    const event = await Event.findOne({ slug })

    if (!event) {
      return []
    }

    return await Event.find({_id: { $ne: event._id}, tags: { $in: event.tags }}).lean()

  }  catch(e) {
    return [];
  }
}