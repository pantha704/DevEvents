import Link from 'next/link';
import React from 'react'
import Image from 'next/image';
interface Props {
  title: string;
  image: string;
  slug?: string;
  location?: string;
  date?: string;
 time?: string;
}

const EventCard = ({title, image, slug, location, date, time}: Props) => {
  return (
    <Link href={`/events/${slug || 'event'}`} id="event-card">
      <Image src={image} alt={title} width={410} height={300} className='poster'/>

      <p className='title'>{title}</p>

      {location && <div className='flex gap-2'>

        <Image src="/icons/pin.svg" alt="location" width={14} height={14} />
        <p className="location">{location}</p>

        </div>}

      {date && <div className='flex gap-2'>

        <Image src="/icons/calendar.svg" alt="date" width={14} height={14} />
        <p className="date">{date}</p>

        </div>}

      {time && <div className='flex gap-2'>

        <Image src="/icons/clock.svg" alt="time" width={14} height={14} />
        <p className="time">{time}</p>

        </div>}
    </Link>
  )
}

export default EventCard