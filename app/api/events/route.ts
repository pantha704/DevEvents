import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Event, IEvent } from "@/database";

export async function POST (req: NextRequest) {
  try {
    await connectToDatabase();

    const formData = await req.formData();
    const formDataEntries = Object.fromEntries(formData.entries());

    // Basic validation and type conversion
    const requiredFields = ['title', 'description', 'overview', 'image', 'venue', 'location', 'date', 'time', 'mode', 'audience', 'organizer'];
    const missingFields = requiredFields.filter(field => {
      const value = formDataEntries[field];
      // Consider undefined, null, empty string, or whitespace-only strings as missing
      return value === undefined || value === null || String(value).trim().length === 0;
    });

    if (missingFields.length > 0) {
      return NextResponse.json({
        message: 'Missing required fields',
        error: `The following fields are required: ${missingFields.join(', ')}`
      }, { status: 400 });
    }

    // Build event object with proper type conversions
    let dateString = formDataEntries.date as string;

    // Validate and parse date
    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({
        message: 'Invalid date format',
        error: 'Date must be a valid date string'
      }, { status: 400 });
    }
    // Convert to ISO string format (YYYY-MM-DD) to match what the schema expects
    dateString = parsedDate.toISOString().split('T')[0];

    const event: IEvent = {
      title: formDataEntries.title as string,
      description: formDataEntries.description as string,
      overview: formDataEntries.overview as string,
      image: formDataEntries.image as string,
      venue: formDataEntries.venue as string,
      location: formDataEntries.location as string,
      date: dateString,
      time: formDataEntries.time as string,
      mode: formDataEntries.mode as string,
      audience: formDataEntries.audience as string,
      organizer: formDataEntries.organizer as string,
    } as IEvent;

    // Parse agenda if provided (should be a comma-separated string from form)
    if (formDataEntries.agenda) {
      event.agenda = (formDataEntries.agenda as string).split(',').map((item: string) => item.trim());
    } else {
      // Use default empty array or throw error if required
      event.agenda = [];
    }

    // Parse tags if provided (should be a comma-separated string from form)
    if (formDataEntries.tags) {
      event.tags = (formDataEntries.tags as string).split(',').map((item: string) => item.trim());
    } else {
      event.tags = [];
    }

    const createdEvent = await Event.create(event);

    return NextResponse.json(
      {message: 'Event created successfully', event: createdEvent},
      {status: 201}
    );

  } catch(e) {
    console.error(e);
    return NextResponse.json({
      message: 'Event Creation Failed',
      error: e instanceof Error ? e.message : "Unknown"
    }, { status: 500 })

  }
}