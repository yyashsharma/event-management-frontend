import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const [myEvents, setMyEvents] = useState([]);
  const [attendingEvents, setAttendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, []); 

  const fetchEvents = async () => {
    try {
      const [createdResponse, attendingResponse] = await Promise.all([
        axios.get('/api/events/created'),
        axios.get('/api/events/attending')
      ]);
      
      setMyEvents(createdResponse.data);
      setAttendingEvents(attendingResponse.data);
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await axios.delete(`/api/events/${eventId}`);
        setMyEvents(events => events.filter(event => event._id !== eventId));
        toast.success('Event deleted successfully');
      } catch (error) {
        toast.error('Failed to delete event');
      }
    }
  };

  const EventCard = ({ event, isCreator }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Link 
              to={`/events/${event._id}`}
              className="text-xl font-semibold text-gray-900 hover:text-blue-600"
            >
              {event.title}
            </Link>
            <span className="block mt-1 text-sm text-gray-500">
              {format(new Date(event.date), 'EEEE, MMMM d, yyyy h:mm a')}
            </span>
          </div>
          <span className="inline-block px-2 py-1 text-sm font-semibold text-blue-600 bg-blue-100 rounded">
            {event.category}
          </span>
        </div>
        
        <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">{event.location}</span>
          {isCreator && (
            <div className="flex space-x-2">
              <Link
                to={`/events/${event._id}/edit`}
                className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDeleteEvent(event._id)}
                className="px-3 py-1 text-sm font-medium text-red-600 bg-red-100 rounded hover:bg-red-200"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading your events...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-md lg:text-2xl font-bold text-gray-900">
          Welcome, {user.username}!
        </h1>
        <Link
          to="/create-event"
          className="text-sm lg:text-2xl px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create New Event
        </Link>
      </div>

      <div className="space-y-8">
        <section className='bg-lime-900 p-10 rounded-full'>
          <h2 className="text-xl font-semibold text-white pb-2 bg-lime-900 inline p-2 rounded-3xl ">
            Events You're Hosting
          </h2>
          {myEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myEvents.map(event => (
                <EventCard key={event._id} event={event} isCreator={true} />
              ))}
            </div>
          ) : (
            <p className="text-gray-600">You haven't created any events yet.</p>
          )}
        </section>

        <section className='bg-lime-900 p-10 rounded-full'>
          <h2 className="text-xl font-semibold text-white pb-2 bg-lime-900 inline p-2 rounded-3xl">
            Events You're Attending
          </h2>
          {attendingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {attendingEvents.map(event => (
                <EventCard key={event._id} event={event} isCreator={false} />
              ))}
            </div>
          ) : (
            <p className="text-white">You're not attending any events yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;