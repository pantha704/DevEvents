import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Booking, { IBooking } from "@/database/booking.model";
import { Event } from "@/database";

/**
 * POST route handler to create a new booking
 * @param req - Next.js request object containing email and eventSlug
 * @returns JSON response with booking status or error message
 */
export const POST = async (req: NextRequest) => {
  try {
    // Connect to the database
    await connectToDatabase();

    // Parse request body
    const { email, eventSlug } = await req.json();

    // Validate required fields
    if (!email || !eventSlug) {
      return NextResponse.json(
        {
          message: "Missing required fields",
          error: "Both email and eventSlug are required"
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          message: "Invalid email format",
          error: "Please provide a valid email address"
        },
        { status: 400 }
      );
    }

    // Check if event exists
    const event = await Event.findOne({ slug: eventSlug });
    if (!event) {
      return NextResponse.json(
        {
          message: "Event not found",
          error: `No event found with slug: ${eventSlug}`
        },
        { status: 404 }
      );
    }

    // Check if user has already booked this event
    const existingBooking = await Booking.findOne({ email, eventSlug });
    if (existingBooking) {
      return NextResponse.json(
        {
          message: "Booking already exists",
          error: "You have already booked this event"
        },
        { status: 409 }
      );
    }

    // Create new booking
    const newBooking: IBooking = await Booking.create({
      email,
      eventSlug,
      eventId: event._id,
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        message: "Event booked successfully",
        booking: newBooking
      },
      { status: 201 }
    );
 } catch (error) {
    // Handle unexpected errors
    console.error("Error creating booking:", error);
    return NextResponse.json(
      {
        message: "Booking creation failed",
        error: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    );
  }
};