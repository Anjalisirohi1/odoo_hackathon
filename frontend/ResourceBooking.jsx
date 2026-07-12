// ResourceBooking.jsx
import React, { useState, useEffect } from 'react';

export default function ResourceBooking() {
    const [resources, setResources] = useState([]);
    const [selectedResourceId, setSelectedResourceId] = useState('');
    const [selectedDate, setSelectedDate] = useState('2026-07-07');
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [bookingError, setBookingError] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState('');

    // Local/Session Token Check
    const token = localStorage.getItem('token') || '';

    // Hours displayed on timeline list
    const hours = [
        { label: '8:00 AM', value: 8 },
        { label: '9:00 AM', value: 9 },
        { label: '10:00 AM', value: 10 },
        { label: '11:00 AM', value: 11 },
        { label: '12:00 PM', value: 12 },
        { label: '1:00 PM', value: 13 },
        { label: '2:00 PM', value: 14 },
        { label: '3:00 PM', value: 15 },
        { label: '4:00 PM', value: 16 }
    ];

    // Fetch all bookable assets
    useEffect(() => {
        fetch('http://localhost:5000/api/bookings/resources', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setResources(data);
                    if (data.length > 0) setSelectedResourceId(data[0].id);
                }
            })
            .catch(err => console.error(err));
    }, [token]);

    // Fetch Bookings when Resource or Date changes
    useEffect(() => {
        if (!selectedResourceId || !selectedDate) return;
        setLoading(true);
        setError('');

        fetch(`http://localhost:5000/api/bookings?assetId=${selectedResourceId}&date=${selectedDate}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) setError(data.error);
                else setBookings(data);
            })
            .catch(() => setError('Failed to retrieve daily schedule.'))
            .finally(() => setLoading(false));
    }, [selectedResourceId, selectedDate, token]);

    const activeResource = resources.find(r => r.id === parseInt(selectedResourceId));

    // Determine top-offset and height percentages to position bookings over our timeline layout
    const getBookingStyle = (startStr, endStr) => {
        const start = new Date(startStr);
        const end = new Date(endStr);

        const startHour = start.getHours() + start.getMinutes() / 60;
        const endHour = end.getHours() + end.getMinutes() / 60;

        // Relative to an 8:00 AM start line
        const timelineStartHour = 8;
        const timelineTotalHours = 8; // From 8 AM to 4 PM

        const top = ((startHour - timelineStartHour) / timelineTotalHours) * 100;
        const height = ((endHour - startHour) / timelineTotalHours) * 100;

        return {
            top: `${Math.max(0, top)}%`,
            height: `${Math.max(8, height)}%` // Guarantee minimal readable block size
        };
    };

    const handleCreateBooking = async (e) => {
        e.preventDefault();
        setBookingError('');
        setBookingSuccess('');

        const startDateTime = `${selectedDate}T${startTime}:00`;
        const endDateTime = `${selectedDate}T${endTime}:00`;

        try {
            const res = await fetch('http://localhost:5000/api/bookings', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    asset_id: selectedResourceId,
                    start_time: startDateTime,
                    end_time: endDateTime
                })
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 409) {
                    setBookingError(data.conflictDetails.message); // Displays conflict alert from screenshot [1]
                } else {
                    setBookingError(data.error || 'Failed to complete booking.');
                }
            } else {
                setBookingSuccess('Booking confirmed!');
                // Refresh local items
                setBookings(prev => [...prev, data.booking]);
                setTimeout(() => {
                    setIsModalOpen(false);
                    setBookingSuccess('');
                }, 1500);
            }
        } catch {
            setBookingError('Server connection lost.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans">
            {/* Top Banner */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Resource Booking</h1>
                    <p className="text-slate-500 mt-1">Manage schedules and reservations for shared enterprise assets.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg flex items-center gap-2 transition"
                >
                    <span className="text-xl">+</span> Book a slot
                </button>
            </div>

            {/* Main Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                {/* Left Side: Selectors & Details */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        {/* Resource Selector */}
                        <div className="mb-5">
                            <label className="block text-xs font-semibold text-blue-600 tracking-wider uppercase mb-2">Select Resource</label>
                            <select
                                value={selectedResourceId}
                                onChange={(e) => setSelectedResourceId(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {resources.map((res) => (
                                    <option key={res.id} value={res.id}>{res.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date Selector */}
                        <div className="mb-6">
                            <label className="block text-xs font-semibold text-blue-600 tracking-wider uppercase mb-2">Date Selector</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-medium text-slate-800 focus:outline-none"
                            />
                        </div>

                        {/* Asset Specs Info box */}
                        <div className="border-t border-slate-100 pt-4 space-y-3">
                            <div className="flex justify-between text-sm text-slate-500">
                                <span>Capacity</span>
                                <span className="font-semibold text-slate-800">12 People</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-500 items-center">
                                <span>Amenities</span>
                                <span className="flex gap-2 text-slate-600 text-base">💻 📶 📺</span>
                            </div>
                        </div>
                    </div>

                    {/* Daily Status Card */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                        <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
                            <span>ℹ️</span> Daily Status
                        </h4>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                        </div>
                        <p className="text-xs font-medium text-slate-500 mt-2">50% Available today</p>
                    </div>
                </div>

                {/* Right Side: Interactive Calendar Timeline */}
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Timeline View</h3>
                            <div className="flex gap-4 text-xs font-semibold">
                                <span className="flex items-center gap-1.5 text-blue-600">
                                    <span className="w-3 h-3 rounded-full bg-blue-100 border border-blue-400"></span> Booked
                                </span>
                                <span className="flex items-center gap-1.5 text-red-500">
                                    <span className="w-3 h-3 rounded-full bg-red-100 border border-red-400"></span> Conflict
                                </span>
                            </div>
                        </div>

                        {/* Scrollable Schedule Timeline */}
                        <div className="relative border-l border-slate-100 pl-4 py-2 space-y-12">
                            {hours.map((hour) => (
                                <div key={hour.value} className="flex items-start text-sm border-b border-slate-50 pb-2">
                                    <span className="w-16 font-medium text-slate-400 select-none">{hour.label}</span>
                                    <div className="flex-1 min-h-[48px]"></div>
                                </div>
                            ))}

                            {/* Dynamic Absolute Booking Cards Position Overlay [1] */}
                            <div className="absolute top-4 left-20 right-4 bottom-12 pointer-events-none">
                                {bookings.map((booking) => {
                                    const style = getBookingStyle(booking.start_time, booking.end_time);
                                    return (
                                        <div
                                            key={booking.id}
                                            style={style}
                                            className="absolute left-0 right-0 bg-blue-100/90 hover:bg-blue-200/95 border-l-4 border-blue-600 rounded-r-lg p-3 shadow-sm transition pointer-events-auto"
                                        >
                                            <h4 className="text-sm font-bold text-blue-900">
                                                Booked - {booking.booked_by || 'Staff'}
                                            </h4>
                                            <p className="text-xs text-blue-700 mt-0.5">
                                                {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Form Modal Dialog */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
                        <div className="bg-blue-600 text-white p-6">
                            <h3 className="text-lg font-bold">Reserve Resource</h3>
                            <p className="text-xs text-blue-100 mt-1">
                                Currently reserving for {activeResource?.name || 'Asset'}
                            </p>
                        </div>

                        <form onSubmit={handleCreateBooking} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">End Time</label>
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Conflict Notification Banner (Matches UI conflict state) [1] */}
                            {bookingError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-xs leading-relaxed font-medium">
                                    ⚠️ <span className="font-bold">Conflict Identified:</span> {bookingError}
                                </div>
                            )}

                            {bookingSuccess && (
                                <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-xs font-semibold text-center">
                                    ✅ {bookingSuccess}
                                </div>
                            )}

                            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setBookingError('');
                                    }}
                                    className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                                >
                                    Confirm Slot
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}