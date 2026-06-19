import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Loader2, MapPin, Clock, Bike, Phone, User, Navigation, RefreshCw, AlertCircle } from 'lucide-react';

const RiderTracking = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchRiders = useCallback(async () => {
    setError(null);
    try {
      const res = await axios.get('/api/riders/admin/list');
      setRiders(res.data.riders || []);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch riders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRiders();
    const interval = setInterval(fetchRiders, 15000);
    return () => clearInterval(interval);
  }, [fetchRiders]);

  const getTimeSince = (dateStr) => {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m ago`;
  };

  const activeRiders = riders.filter((r) => r.currentLat && r.currentLng);
  const inactiveRiders = riders.filter((r) => !r.currentLat || !r.currentLng);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rider Live Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeRiders.length} active · {inactiveRiders.length} offline
            {lastRefresh && ` · Last updated: ${lastRefresh.toLocaleTimeString()}`}
          </p>
        </div>
        <button
          onClick={fetchRiders}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Riders */}
          {activeRiders.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                Live Riders
              </h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {activeRiders.map((rider) => (
                  <div key={rider._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Bike size={20} className="text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{rider.name}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone size={12} />
                            {rider.phone || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        rider.status === 'approved' ? 'bg-green-100 text-green-700' :
                        rider.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {rider.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Navigation size={14} className="text-indigo-500 shrink-0" />
                        <a
                          href={`https://www.google.com/maps?q=${rider.currentLat},${rider.currentLng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline truncate"
                        >
                          {rider.currentLat.toFixed(4)}, {rider.currentLng.toFixed(4)}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={14} className={new Date(rider.lastLocationUpdate).getTime() > Date.now() - 120000 ? 'text-green-500' : 'text-yellow-500'} />
                        <span>{getTimeSince(rider.lastLocationUpdate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Bike size={14} className="text-gray-400" />
                        <span className="capitalize">{rider.vehicleType || 'bike'}</span>
                        <span className="text-gray-300 mx-1">|</span>
                        <span>{rider.totalDeliveries || 0} deliveries</span>
                      </div>
                      {rider.numberPlate && (
                        <div className="text-xs text-gray-400 uppercase font-mono">
                          {rider.numberPlate}
                        </div>
                      )}
                    </div>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${rider.currentLat},${rider.currentLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100 transition"
                    >
                      <MapPin size={14} />
                      View on Map
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inactive Riders */}
          {inactiveRiders.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                Offline Riders ({inactiveRiders.length})
              </h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Phone</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Vehicle</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Deliveries</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Last Seen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {inactiveRiders.map((rider) => (
                      <tr key={rider._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{rider.name}</td>
                        <td className="px-4 py-3 text-gray-600">{rider.phone || '-'}</td>
                        <td className="px-4 py-3 capitalize text-gray-600">{rider.vehicleType || '-'}</td>
                        <td className="px-4 py-3">{rider.totalDeliveries || 0}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            rider.status === 'approved' ? 'bg-green-100 text-green-700' :
                            rider.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {rider.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {rider.lastLocationUpdate ? getTimeSince(rider.lastLocationUpdate) : 'Never'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {riders.length === 0 && (
            <div className="text-center py-12 text-gray-500">No riders found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default RiderTracking;
