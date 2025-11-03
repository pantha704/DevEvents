'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CreateEvent = () => {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    overview: '',
    venue: '',
    location: '',
    date: '',
    time: '',
    mode: 'online',
    audience: '',
    agenda: '',
    organizer: '',
    tags: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const data = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'agenda') {
        data.append(key, value.split('\n').map(item => item.trim()).filter(Boolean).join(','))
      } else if (key === 'tags') {
        data.append(key, value.split(',').map(item => item.trim()).filter(Boolean).join(','))
      } else {
        data.append(key, value)
      }
    })
    if (imageFile) {
      data.append('image', imageFile)
    }

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        body: data,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create event')
      }

      const { event } = await response.json()
      setSuccess(true)
      router.push(`/events/${event.slug}`)
      setFormData({
        title: '',
        description: '',
        overview: '',
        venue: '',
        location: '',
        date: '',
        time: '',
        mode: 'online',
        audience: '',
        agenda: '',
        organizer: '',
        tags: '',
      });
      setImageFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <section className="flex flex-col items-center py-10 max-w-4xl mx-auto px-4">
      <h1 className="text-center text-3xl font-bold mb-8">Create New Event</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">Event created successfully!</p>}
      <form onSubmit={handleSubmit} className="bg-dark-100 border-dark-200 card-shadow w-full flex flex-col gap-6 rounded-[10px] border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="title" className="text-light-100">Title *</label>
            <input id="title" name="title" value={formData.title} onChange={handleChange} required className="bg-dark-200 rounded-[6px] px-5 py-2.5 text-light-100" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="venue" className="text-light-100">Venue *</label>
            <input id="venue" name="venue" value={formData.venue} onChange={handleChange} required className="bg-dark-200 rounded-[6px] px-5 py-2.5 text-light-100" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="location" className="text-light-100">Location *</label>
            <input id="location" name="location" value={formData.location} onChange={handleChange} required className="bg-dark-200 rounded-[6px] px-5 py-2.5 text-light-100" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="date" className="text-light-100">Date (YYYY-MM-DD) *</label>
            <input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required className="bg-dark-200 rounded-[6px] px-5 py-2.5 text-light-100" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="time" className="text-light-100">Time (HH:MM) *</label>
            <input id="time" name="time" type="time" value={formData.time} onChange={handleChange} required className="bg-dark-200 rounded-[6px] px-5 py-2.5 text-light-100" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="mode" className="text-light-100">Mode</label>
            <select id="mode" name="mode" value={formData.mode} onChange={handleChange} className="bg-dark-200 rounded-[6px] px-5 py-2.5 text-light-100">
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="audience" className="text-light-100">Audience *</label>
            <input id="audience" name="audience" value={formData.audience} onChange={handleChange} required className="bg-dark-200 rounded-[6px] px-5 py-4 text-light-100" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="image" className="text-light-100">Image *</label>
            <input id="image" type="file" onChange={handleFileChange} accept="image/*" required className="bg-dark-200 rounded-[6px] px-5 py-2.5 text-light-100 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-black hover:file:bg-primary/90" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="description" className="text-light-100">Description *</label>
          <textarea id="description" name="description" value={formData.description} onChange={handleChange} required rows={3} className="bg-dark-200 rounded-[6px] px-5 py-2.5 text-light-100" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="overview" className="text-light-100">Overview *</label>
          <textarea id="overview" name="overview" value={formData.overview} onChange={handleChange} required rows={3} className="bg-dark-200 rounded-[6px] px-5 py-2.5 text-light-100" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="agenda" className="text-light-100">Agenda (one per line)</label>
          <textarea id="agenda" name="agenda" value={formData.agenda} onChange={handleChange} rows={4} className="bg-dark-200 rounded-[6px] px-5 py-2.5 text-light-100" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="organizer" className="text-light-100">Organizer *</label>
          <textarea id="organizer" name="organizer" value={formData.organizer} onChange={handleChange} required rows={3} className="bg-dark-200 rounded-[6px] px-5 py-2.5 text-light-100" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="tags" className="text-light-100">Tags (comma separated) *</label>
          <input id="tags" name="tags" value={formData.tags} onChange={handleChange} required className="bg-dark-200 rounded-[6px] px-5 py-2.5 text-light-100" />
        </div>
        <button type="submit" className="bg-primary hover:bg-primary/90 w-full cursor-pointer items-center justify-center rounded-[6px] px-4 py-2.5 text-lg font-semibold text-black">
          Create Event
        </button>
      </form>
    </section>
  )
}

export default CreateEvent