import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar, Clock, Truck, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { format, addDays } from 'date-fns';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const congestionStyles = {
  low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Low' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Medium' },
  high: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'High' },
};

const routes = ["MG Road Commercial Zone", "Western Express Highway", "Eastern Freeway", "Marine Drive", "BKC Business District"];

export default function SlotsPage() {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedRoute, setSelectedRoute] = useState(routes[0]);
  const [booking, setBooking] = useState(false);
  const [dateOffset, setDateOffset] = useState(0);

  const dates = Array.from({ length: 7 }, (_, i) => ({
    date: format(addDays(new Date(), i), 'yyyy-MM-dd'),
    label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(addDays(new Date(), i), 'EEE, MMM d')
  }));

  const fetchSlots = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/slots`, {
        params: { date: selectedDate, route: selectedRoute },
        withCredentials: true
      });
      setSlots(data);
    } catch (err) {
      console.error('Fetch slots error:', err);
    }
  }, [selectedDate, selectedRoute]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const fetchBookedSlots = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/slots/bookings`, { withCredentials: true });
      setBookedSlots(data);
    } catch (err) {
      console.error('Fetch booked slots error:', err);
    }
  }, []);

  useEffect(() => { fetchBookedSlots(); }, [fetchBookedSlots]);

  const handleBook = async (slotId) => {
    setBooking(true);
    try {
      const response = await axios.post(`${API}/slots/book`, { slot_id: slotId }, { withCredentials: true });
      fetchSlots();
      fetchBookedSlots();
      // Show success with credit info
      if (response.data.remaining_credits !== null && response.data.remaining_credits !== undefined) {
        toast.success(`Slot booked! Credits used: ${response.data.credit_cost}. Remaining: ${response.data.remaining_credits}`);
      } else {
        toast.success('Slot booked successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const handleCancelSlot = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking? Credits will be refunded.")) return;
    
    try {
      const res = await fetch(`${API}/slots/cancel/${bookingId}`, {
        method: "DELETE",
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Booking cancelled. ${data.refunded} credit(s) refunded.`);
        fetchBookedSlots();
        fetchSlots();
      } else {
        toast.error(data.detail || "Failed to cancel");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6 bg-[#F3F4F6]" data-testid="slots-page">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'IBM Plex Sans' }}>
              Delivery Slots
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">View and book delivery time windows</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#6B7280]" />
            <span className="text-sm font-mono text-[#6B7280]">{selectedDate}</span>
          </div>
        </div>

        {/* Date selector */}
        <div className="bg-white border border-[#E5E7EB] p-3 mb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {dates.map(d => (
              <button
                key={d.date}
                data-testid={`date-${d.date}`}
                onClick={() => setSelectedDate(d.date)}
                className={`shrink-0 px-4 py-2 text-sm border transition-colors ${
                  selectedDate === d.date
                    ? 'bg-[#002FA7] text-white border-[#002FA7]'
                    : 'bg-white text-[#111827] border-[#E5E7EB] hover:border-[#002FA7]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Route selector */}
        <div className="bg-white border border-[#E5E7EB] p-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs tracking-[0.15em] uppercase font-bold text-[#6B7280]">Route</span>
            <Select value={selectedRoute} onValueChange={setSelectedRoute}>
              <SelectTrigger className="w-[300px]" data-testid="route-selector">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {routes.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* My Booked Slots */}
        {bookedSlots.length > 0 && (
          <div className="bg-white border border-[#E5E7EB] mb-4" data-testid="booked-slots">
            <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#002FA7]/5">
              <h2 className="text-sm font-bold text-[#002FA7]" style={{ fontFamily: 'IBM Plex Sans' }}>
                My Booked Slots ({bookedSlots.length})
              </h2>
            </div>
            <div className="divide-y divide-[#E5E7EB]">
              {bookedSlots.map(booking => {
                const isCancelled = booking.status === 'cancelled';
                return (
                  <div key={booking._id || booking.booking_id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-[#6B7280]" />
                      <div>
                        <p className="text-sm font-medium">
                          {booking.start_time} - {booking.end_time}
                          {booking.route_name && <span className="text-[#6B7280] ml-2">({booking.route_name})</span>}
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          {booking.date} • Cost: {booking.credit_cost || 1} credits
                        </p>
                      </div>
                    </div>
                    <div>
                      {isCancelled ? (
                        <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-500">Cancelled</Badge>
                      ) : (
                        <button
                          onClick={() => handleCancelSlot(booking._id || booking.booking_id)}
                          className="text-red-600 border border-red-300 rounded px-3 py-1 text-sm hover:bg-red-50"
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Slots table */}
        <div className="bg-white border border-[#E5E7EB]">
          <div className="grid grid-cols-[1fr_80px_100px_80px_80px_100px] gap-0 border-b border-[#E5E7EB] px-4 py-2 bg-[#F9FAFB]">
            <span className="text-xs tracking-[0.15em] uppercase font-bold text-[#6B7280]">Time Slot</span>
            <span className="text-xs tracking-[0.15em] uppercase font-bold text-[#6B7280]">Trucks</span>
            <span className="text-xs tracking-[0.15em] uppercase font-bold text-[#6B7280]">Capacity</span>
            <span className="text-xs tracking-[0.15em] uppercase font-bold text-[#6B7280]">Traffic</span>
            <span className="text-xs tracking-[0.15em] uppercase font-bold text-[#6B7280]">Cost</span>
            <span className="text-xs tracking-[0.15em] uppercase font-bold text-[#6B7280]">Action</span>
          </div>

          {slots.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#6B7280]">No slots available for this selection</div>
          ) : (
            slots.map(slot => {
              const style = congestionStyles[slot.congestion_level] || congestionStyles.low;
              const pct = Math.round((slot.booked_count / slot.max_capacity) * 100);
              const isFull = slot.booked_count >= slot.max_capacity;
              const canBook = (user?.role === 'organization' || user?.role === 'admin') && !isFull;

              return (
                <div
                  key={slot.slot_id}
                  data-testid={`slot-${slot.slot_id}`}
                  className="grid grid-cols-[1fr_80px_100px_80px_80px_100px] gap-0 border-b border-[#E5E7EB] px-4 py-3 hover:bg-[#F9FAFB] transition-colors items-center"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#6B7280]" />
                    <span className="font-mono text-sm font-medium">{slot.start_time} - {slot.end_time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Truck className="w-3 h-3 text-[#6B7280]" />
                    <span className="font-mono text-sm">{slot.booked_count}/{slot.max_capacity}</span>
                  </div>
                  <div>
                    <div className="w-full bg-[#E5E7EB] h-2">
                      <div
                        className={`h-2 transition-all ${
                          pct < 50 ? 'bg-emerald-500' : pct < 80 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#6B7280] font-mono">{pct}%</span>
                  </div>
                  <div>
                    <Badge className={`${style.bg} ${style.text} ${style.border} border text-[10px]`}>
                      {style.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-3 w-3 text-amber-500" />
                    <span className={`text-xs font-medium ${
                      slot.congestion_level === 'high' ? 'text-red-600' : 
                      slot.congestion_level === 'medium' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {slot.congestion_level === 'high' ? '3' : slot.congestion_level === 'medium' ? '2' : '1'}
                    </span>
                  </div>
                  <div>
                    {isFull ? (
                      <Badge variant="secondary" className="text-[10px]">FULL</Badge>
                    ) : canBook ? (
                      <Button
                        size="sm"
                        data-testid={`book-slot-${slot.slot_id}`}
                        className="h-7 text-xs bg-[#002FA7] hover:bg-[#002FA7]/90"
                        onClick={() => handleBook(slot.slot_id)}
                        disabled={booking}
                      >
                        Book
                      </Button>
                    ) : (
                      <span className="text-xs text-[#6B7280]">View only</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
