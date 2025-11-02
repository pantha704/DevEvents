import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Event, IEvent } from "@/database";

/**
 * GET route handler to fetch an event by its slug
 * @param req - Next.js request object
* @param params - Contains the slug parameter from the dynamic route (as a Promise in Next.js 13+)
* @returns JSON response with event data or error message
 */
export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) => {
 try {
   // Connect to the database
   await connectToDatabase();

   // Extract slug from the URL parameters
   const { slug } = await params;

   // Validate the slug parameter
   if (!slug) {
      return NextResponse.json(
        { message: "Event slug is required" },
        { status: 400 }
      );
    }

    // Validate slug format (alphanumeric, hyphens, and underscores only)
    const slugRegex = /^[a-zA-Z0-9_-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { message: "Invalid slug format", error: "Slug can only contain letters, numbers, hyphens, and underscores" },
        { status: 400 }
      );
    }

    // Find the event by slug
    const event: IEvent | null = await Event.findOne({ slug });

    // Check if the event exists
    if (!event) {
      return NextResponse.json(
        { message: "Event not found", error: "No event found with the provided slug" },
        { status: 404 }
      );
    }

    // Return the event data (excluding sensitive information if any)
    return NextResponse.json(
      { message: "Event fetched successfully", event },
      { status: 200 }
    );
 } catch (error) {
    // Handle unexpected errors
    console.error("Error fetching event by slug:", error);
    return NextResponse.json(
      {
        message: "Event fetching failed",
        error: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    );
  }
};