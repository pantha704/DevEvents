import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Event, IEvent } from "@/database";
import { v2 as cloudinary } from "cloudinary";

// Fallback to CLOUDINARY_URL if individual variables are not set
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
  });
}

export const POST = async (req: NextRequest) => {
  try {
    await connectToDatabase();

    let formDataEntries: Record<string, any>;
    let imageFile: File | null = null;

    // Check the content type to determine how to parse the request
    const contentType = req.headers.get('content-type');

    if (contentType?.includes('multipart/form-data')) {
      // Handle form data
      const formData = await req.formData();

      // Extract image file separately and other fields
      const tempFormDataEntries: Record<string, any> = {};
      for (const [key, value] of formData.entries()) {
        if (key === 'image' && value instanceof File) {
          imageFile = value; // Store the image file separately
        } else {
          tempFormDataEntries[key] = value;
        }
      }
      formDataEntries = tempFormDataEntries;
    } else if (contentType?.includes('application/json')) {
      // Handle JSON data
      const jsonData = await req.json();
      formDataEntries = jsonData;
    } else if (contentType?.includes('application/x-www-form-urlencoded')) {
      // Handle URL-encoded data
      const bodyText = await req.text();
      const urlSearchParams = new URLSearchParams(bodyText);
      formDataEntries = Object.fromEntries(urlSearchParams.entries());
    } else {
      // If no content-type header, try to parse as JSON first, then form data
      try {
        const jsonData = await req.json();
        formDataEntries = jsonData;
      } catch {
        // If JSON parsing fails, try form data
        try {
          const formData = await req.formData();
          const tempFormDataEntries: Record<string, any> = {};
          for (const [key, value] of formData.entries()) {
            if (key === 'image' && value instanceof File) {
              imageFile = value; // Store the image file separately
            } else {
              tempFormDataEntries[key] = value;
            }
          }
          formDataEntries = tempFormDataEntries;
        } catch {
          return NextResponse.json({
            message: 'Unsupported Content-Type',
            error: 'Content-Type must be one of "multipart/form-data", "application/json", or "application/x-www-form-urlencoded", or request should be parseable as JSON'
          }, { status: 400 });
        }
      }
    }

    // Basic validation and type conversion
    const requiredFields = ['title', 'description', 'overview', 'image', 'venue', 'location', 'date', 'time', 'mode', 'audience', 'organizer'];
    const missingFields = requiredFields.filter(field => {
      if (field === 'image' && contentType?.includes('multipart/form-data')) {
        // For form data, check if image file exists
        return !imageFile;
      }
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

    // Normalize mode to match enum values (online, offline, hybrid)
    let modeValue = formDataEntries.mode as string;
    if (modeValue) {
      // Convert to lowercase and extract the main mode type
      const lowerMode = modeValue.toLowerCase();
      // First check if it contains both 'online' and ('offline' or 'in-person') for hybrid
      if (lowerMode.includes('online') && (lowerMode.includes('offline') || lowerMode.includes('in-person'))) {
        modeValue = 'hybrid';
      }
      // Then check for individual modes
      else if (lowerMode.includes('online')) {
        modeValue = 'online';
      } else if (lowerMode.includes('offline') || lowerMode.includes('in-person')) {
        modeValue = 'offline';
      } else if (lowerMode.includes('hybrid')) {
        modeValue = 'hybrid';
      } else {
        // Default fallback
        modeValue = 'hybrid';
      }
    }

    // Initialize event object with image as placeholder
    const event: IEvent = {
      title: formDataEntries.title as string,
      description: formDataEntries.description as string,
      overview: formDataEntries.overview as string,
      image: '', // Will be set after upload
      venue: formDataEntries.venue as string,
      location: formDataEntries.location as string,
      date: dateString,
      time: formDataEntries.time as string,
      mode: modeValue,
      audience: formDataEntries.audience as string,
      organizer: formDataEntries.organizer as string,
    } as IEvent;

    // Parse agenda if provided - handle both string (from form) and array (from JSON)
    if (formDataEntries.agenda !== undefined && formDataEntries.agenda !== null) {
      if (Array.isArray(formDataEntries.agenda)) {
        // If agenda is already an array (from JSON), use it directly
        event.agenda = formDataEntries.agenda.map((item: any) => String(item).trim());
      } else {
        // If agenda is a string (from form), split it
        event.agenda = String(formDataEntries.agenda).split(',').map((item: string) => item.trim());
      }
    } else {
      // If agenda is not provided, provide a default value to satisfy the required schema
      event.agenda = ['Event details to be announced'];
    }

    // Parse tags if provided - handle both string (from form) and array (from JSON)
    if (formDataEntries.tags !== undefined && formDataEntries.tags !== null) {
      if (Array.isArray(formDataEntries.tags)) {
        // If tags is already an array (from JSON), use it directly
        event.tags = formDataEntries.tags.map((item: any) => String(item).trim());
      } else {
        // If tags is a string (from form), split it
        event.tags = String(formDataEntries.tags).split(',').map((item: string) => item.trim());
      }
    } else {
      // If tags is not provided, provide a default value to satisfy the required schema
      event.tags = ['event'];
    }

    // Handle image upload if form data is used (for file uploads)
    if (contentType?.includes('multipart/form-data')) {
      if (!imageFile) {
        return NextResponse.json({message: "Image file is required"}, { status: 400 });
      }

      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadResult = await new Promise ((resolve, reject) => {
        cloudinary.uploader.upload_stream({
          resource_type: 'image',
          folder: 'DevEvent'
        }, (error, results) => {
          if (error) return reject(error);
          resolve(results)
        }).end(buffer);
      });

      event.image = (uploadResult as { secure_url: string }).secure_url;

    } else {
      // For JSON requests, use the image URL directly
      event.image = formDataEntries.image as string;
    }

    const createdEvent = await Event.create(event)

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

export const GET = async () => {
  try {
      await connectToDatabase();

      const events = await Event.find().sort({ createdAt: -1 });

      return NextResponse.json({ message: 'Events fetched successfully', events}, { status: 200 });
  } catch (e) {
    return NextResponse.json({message: "Event fetching failed" , error: (e as any).message}, { status: 500 })
  }
}