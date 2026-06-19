import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Search } from 'lucide-react';

const STATUS_BADGE = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  suspended: 'bg-gray-100 text-gray-800',
};

const RiderManagement = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchRiders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filter) params.status = filter;
      const res = await axios.get('/api/riders/admin/list', { params });
      setRiders(res.data.riders || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch riders');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  const handleApprove = async (riderId) => {
    try {
      await axios.patch(`/api/riders/admin/approve/${riderId}`);
      fetchRiders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve rider');
    }
  };

  const handleReject = async (riderId) => {
    try {
      await axios.patch(`/api/riders/admin/reject/${riderId}`);
      fetchRiders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject rider');
    }
  };

  const handleSuspend = async (riderId) => {
    if (!window.confirm('Suspend this rider?')) return;
    try {
      await axios.patch(`/api/riders/admin/suspend/${riderId}`);
      fetchRiders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to suspend rider');
    }
  };

  const filtered = riders.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.phone?.includes(q)
    );
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Rider Management</h1>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search riders..."
              className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border rounded-lg text-sm outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
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
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No riders found</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Phone</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">DOB</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Vehicle</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Number Plate</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Deposit</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Deliveries</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Location</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((rider) => (
                <tr key={rider._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{rider.name}</td>
                  <td className="px-4 py-3 text-gray-600">{rider.email}</td>
                  <td className="px-4 py-3 text-gray-600">{rider.phone}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {rider.dateOfBirth ? new Date(rider.dateOfBirth).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 capitalize">{rider.vehicleType}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs uppercase">{rider.numberPlate || '-'}</td>
                  <td className="px-4 py-3">
                    {rider.depositPaid ? (
                      <span className="text-green-600 font-medium">₹{rider.depositAmount}</span>
                    ) : (
                      <span className="text-red-500 text-xs font-medium">NOT PAID</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{rider.totalDeliveries || 0}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {rider.currentLat && rider.currentLng ? (
                      <span title={`${rider.currentLat}, ${rider.currentLng}`}>
                        <a href={`https://www.google.com/maps?q=${rider.currentLat},${rider.currentLng}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline">
                          View Map
                        </a>
                        <br />
                        <span className="text-[10px] text-gray-400">
                          {rider.lastLocationUpdate
                            ? new Date(rider.lastLocationUpdate).toLocaleString()
                            : ''}
                        </span>
                      </span>
                    ) : (
                      'Unavailable'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[rider.status] || ''}`}>
                      {rider.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {rider.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(rider._id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition"
                          >
                            <CheckCircle2 size={14} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(rider._id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                        </>
                      )}
                      {rider.status === 'approved' && (
                        <button
                          onClick={() => handleSuspend(rider._id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RiderManagement;
