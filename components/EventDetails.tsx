import { IEvent, Event } from '@/database';
import { notFound } from 'next/navigation';
import React from 'react'
import Image from 'next/image';
import BookEvent from '@/components/BookEvent';
import { getSimilarEventsBySlug, getBookingCountBySlug } from '@/lib/actions/event.actions';
import EventCard from '@/components/EventCard';

const EventDetailItem = ({icon, alt, label}: { icon: string; alt: string, label: string}) => {
  return <div className='flex-row-gap-2 items-center'>
    <Image src={icon} alt={alt} width={17} height={17}></Image>
    <p>{label}</p>
  </div>
}

const EventAgenda = ({ agendaItems }: { agendaItems: string[] }) => {
  return <div className='agenda'>
    <h2>Agenda</h2>
    <ul>
      {agendaItems.map((item)=> (
        <li key={item}>{item}</li>
      ))}
    </ul>
  </div>
}

const EventTags = ({tags}: {tags: string[]}) => {
  return <div className='flex flex-row gap-1.5 flex-wrap'>
    {tags.map(tag => (
      <div className='pill' key={tag}>{tag}</div>
    ))}
  </div>
}

const EventDetails = async ({ params }: { params: Promise<string>}) => {

  const slug = await params;

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  const baseUrl = BASE_URL ? `${BASE_URL}/api/events/${slug}` : `/api/events/${slug}`;
  const response = await fetch(baseUrl);

  if (!response.ok) {
    if (response.status === 404) {
      return notFound();
    }
    throw new Error(`Failed to fetch event: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const event: IEvent = data.event;

  if(!event) return notFound();
  // console.log(event);
  const bookings = await getBookingCountBySlug(slug);

  const { organizer, description, image, overview, date, time, location, mode, agenda, audience, tags, } = event;

  const similarEvents: IEvent[] = await getSimilarEventsBySlug(slug);

  return (
    <section id="event">
      <div className='header'>
        <h1>Event Description</h1>
        <p>{description}</p>
      </div>
      <div className='details'>
        {/* LEFT SIDE */}
        <div className='content'>
          <Image src={image} alt="Event Banner" width={800} height={800} className="banner" />

          <section className='flex-col-gap-2'>
            <h1>Overview</h1>
            <p>{overview}</p>
          </section>

          <section className='flex-col-gap-2'>
            <h2>Event Details</h2>
            <EventDetailItem icon='/icons/calendar.svg' alt='calendar' label={date} />
            <EventDetailItem icon='/icons/clock.svg' alt='time' label={time} />
            <EventDetailItem icon='/icons/pin.svg' alt='location' label={location} />
            <EventDetailItem icon='/icons/mode.svg' alt='mode' label={mode} />
            <EventDetailItem icon='/icons/audience.svg' alt='audience' label={audience} />
          </section>

          <EventAgenda agendaItems={agenda} />

          <section className='flex-col-gap-2'>
            <h2>About the Organizer</h2>
            <p>{organizer}</p>
          </section>

          <EventTags tags={tags}/>
        </div>

        {/* RIGHT SIDE */}
        <aside className='booking'>
            <div className='signup-card'>
              <h2>Book Your Spot</h2>
              {bookings > 0 ? (
                <p className='text-sm'>
                  Join {bookings} people who have already booked their spot!
                </p>
              ): (
                <p className='text-sm'>
                  Be the first to book your spot!
                </p>
              )}
              <BookEvent eventId={(event._id as any).toString()} slug={slug} />
            </div>
        </aside>
      </div>

      <div className='flex w-full flex-col gap-4 pt-20'>
        <h2>Similar Events</h2>
        <div className='events'>
          {similarEvents.length > 0 && similarEvents.map((similarEvent) => (
            <EventCard key={similarEvent.slug} {...similarEvent} />
          )) }
        </div>
      </div>
    </section>
  )
}

export default EventDetails