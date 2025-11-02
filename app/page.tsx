import ExploreBtn from "@/components/ExploreBtn"
import EventCard from "@/components/EventCard"
import { events } from "@/lib/constants"
import { IEvent } from "@/database";
import { cacheLife } from "next/cache";

const Home = async () => {

  'use cache'
  cacheLife('hours')
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  const baseUrl = BASE_URL ? `${BASE_URL.replace(/\/$/, '')}/api/events` : '/api/events';
  const response = await fetch(baseUrl);
  const { events } = await response.json();

  return (
    <section>
      <h1 className="text-center">The Hub for Every Dev <br /> Event You Can&apos;t Miss</h1>
      <p className="text-center mt-5">Hackathons, Meetups, And Conferences, All In One Place</p>

      <ExploreBtn/>

      <div className="mt-20 space-y-7">
        <h3>Featured Events</h3>

        <ul className="events">
          {events.map((event: IEvent) => (
            <li key={event.title}>
              <EventCard {...event}></EventCard>
            </li>
          ))}
        </ul>

      </div>

    </section>
  )
}

export default Home