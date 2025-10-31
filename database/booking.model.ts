import { Schema, model, models, Document, Types } from 'mongoose';

// TypeScript interface for Booking document
export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      validate: {
        validator: (v: string) => {
          // RFC 5322 compliant email validation
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format',
      },
    },
  },
  {
    timestamps: true, // Auto-generate createdAt and updatedAt
  }
);

// Add compound unique index to ensure one booking per email per event
// NOTE: Ensure any existing duplicate (same eventId+email) records are resolved/migrated
// before applying this index in production to prevent index creation failure
BookingSchema.index({ eventId: 1, email: 1 }, { unique: true, background: true });

/**
 * Pre-save hook to validate that the referenced Event exists
 * Prevents orphaned bookings by checking Event existence before saving
 */
BookingSchema.pre('save', async function (next) {
  // Only validate eventId if it's new or modified
  if (this.isModified('eventId')) {
    try {
      // Dynamically import Event model to avoid circular dependency
      const Event = models.Event || (await import('./event.model')).default;

      const eventExists = await Event.exists({ _id: this.eventId });

      if (!eventExists) {
        return next(new Error('Referenced event does not exist'));
      }
    } catch {
      return next(new Error('Failed to validate event reference'));
    }
  }

  next();
});

// Prevent model recompilation in development (Next.js hot reload)
const Booking = models.Booking || model<IBooking>('Booking', BookingSchema);

export default Booking;
