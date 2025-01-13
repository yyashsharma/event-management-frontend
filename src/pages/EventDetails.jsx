import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";

function EventDetails() {
    const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attending, setAttending] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchEventDetails = useCallback(async () => {
    try {
      const response = await axios.get(`/api/events/${id}`);
      setEvent(response.data);
      const isUserAttending = response.data.attendees.some(
        (attendee) => attendee._id === user?._id
      );
      setAttending(isUserAttending);
      setAttendeeCount(response.data.attendees.length);
    } catch (error) {
      toast.error("Failed to load event details");
      navigate("/");
    } finally {
      setLoading(false);
    }
  }, [id, user, navigate]);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const socket = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('Connected to socket server');
      socket.emit('joinEvent', id);
    });

    socket.on('attendeeUpdate', (data) => {
      console.log('Received attendee update:', data);
      if (data.eventId === id) {
        setAttendeeCount(data.count);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Failed to connect to real-time updates');
    });

    fetchEventDetails();

    return () => {
      console.log('Cleaning up socket connection');
      socket.emit('leaveEvent', id);
      socket.disconnect();
    };
  }, [id, fetchEventDetails]);

  const handleAttendEvent = async () => {
    if (!user) {
      toast.error("Please login to attend events");
      navigate("/login");
      return;
    }

    try {
      const response = await axios.post(`/api/events/${id}/attendees`, {
        userId: user._id,
      });
      
      // Update local state immediately
      setAttending(true);
      if (response.data.attendeeCount !== undefined) {
        setAttendeeCount(response.data.attendeeCount);
      } else {
        // Fallback: increment the current count
        setAttendeeCount(prevCount => prevCount + 1);
      }
      
      toast.success("You are now attending the event");
    } catch (error) {
      toast.error("Failed to update attendance");
    }
  };

  const handleLeaveEvent = async () => {
    if (!user) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    try {
      const response = await axios.delete(`/api/events/${id}/attendees/${user._id}`);
      
      // Update local state immediately
      setAttending(false);
      if (response.data.attendeeCount !== undefined) {
        setAttendeeCount(response.data.attendeeCount);
      } else {
        // Fallback: decrement the current count
        setAttendeeCount(prevCount => Math.max(0, prevCount - 1));
      }
      
      toast.success("You have left the event");
    } catch (error) {
      toast.error("Failed to leave event");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading event details...</div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {event.title}
              </h1>
              <span className="inline-block px-3 py-1 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full">
                {event.category}
              </span>
            </div>
            {attending ? (
              <button
                onClick={handleLeaveEvent}
                className={`px-6 py-2 rounded-md text-sm font-medium ${
                  attending
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Leave Event
              </button>
            ) : (
              <button
                onClick={handleAttendEvent}
                className={`px-6 py-2 rounded-md text-sm font-medium ${
                  attending
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Attend Event
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Details
              </h2>
              <p className="text-gray-600 whitespace-pre-wrap">
                {event.description}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Date & Time
                </h3>
                <p className="mt-1 text-lg text-gray-900">
                  {format(new Date(event.date), "EEEE, MMMM d, yyyy h:mm a")}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Location</h3>
                <p className="mt-1 text-lg text-gray-900">{event.location}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Attendees</h3>
                <p className="mt-1 text-lg text-gray-900">
                  {attendeeCount} people attending
                </p>
              </div>

              {event.creator._id === user?._id && (
                <div className="pt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Event Management
                  </h3>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => navigate(`/events/${id}/edit`)}
                      className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200"
                    >
                      Edit Event
                    </button>
                    <button
                      onClick={async () => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete this event?"
                          )
                        ) {
                          try {
                            await axios.delete(`/api/events/${id}`);
                            toast.success("Event deleted successfully");
                            navigate("/dashboard");
                          } catch (error) {
                            toast.error("Failed to delete event");
                          }
                        }
                      }}
                      className="px-4 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200"
                    >
                      Delete Event
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;
