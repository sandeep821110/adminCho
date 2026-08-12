import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Loader2, Bike, Package, MapPin, Phone, User, Clock, AlertCircle, CheckCircle2, XCircle, Search } from 'lucide-react';

const RiderOrderAssignment = () => {
  const [riders, setRiders] = useState([]);
  const [selectedRider, setSelectedRider] = useState(null);
  const [riderOrders, setRiderOrders] = useState([]);
  const [unassignedOrders, setUnassignedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [search, setSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ridersRes, ordersRes] = await Promise.all([
        axios.get('/api/riders/admin/list'),
        axios.get('/api/orders', { params: { limit: 100 } }),
      ]);
      setRiders(ridersRes.data.riders || []);
      const allOrders = ordersRes.data.data || ordersRes.data.orders || [];
      setUnassignedOrders(allOrders.filter((o) => !o.assignedRider));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchRiderOrders = useCallback(async (riderId) => {
    setOrdersLoading(true);
    try {
      const res = await axios.get('/api/orders', { params: { limit: 100 } });
      const allOrders = res.data.data || res.data.orders || [];
      setRiderOrders(allOrders.filter((o) => o.assignedRider?._id === riderId || o.assignedRider === riderId));
    } catch {
      setRiderOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const selectRider = (rider) => {
    setSelectedRider(rider);
    setAssignError('');
    fetchRiderOrders(rider._id);
  };

  const handleAssign = async (orderId) => {
    if (!selectedRider) return;
    setAssigning(true);
    setAssignError('');
    try {
      const res = await axios.post('/api/riders/admin/assign-order', {
        orderId,
        riderId: selectedRider._id,
      });
      setUnassignedOrders((prev) => prev.filter((o) => o._id !== orderId));
      setRiderOrders((prev) => [...prev, res.data.order]);
    } catch (err) {
      setAssignError(err.response?.data?.message || 'Failed to assign order');
    } finally {
      setAssigning(false);
    }
  };

  const filteredRiders = riders.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q) || r.phone?.includes(q);
  });

  const approvedRiders = filteredRiders.filter((r) => r.status === 'approved');
  const otherRiders = filteredRiders.filter((r) => r.status !== 'approved');

  const filteredUnassigned = unassignedOrders.filter((o) => {
    if (!orderSearch) return true;
    const q = orderSearch.toLowerCase();
    return (o.orderNumber || '').toLowerCase().includes(q)
      || o._id?.toLowerCase().includes(q)
      || (o.shippingAddress?.city || '').toLowerCase().includes(q)
      || (o.shippingAddress?.name || o.shippingAddress?.fullName || '').toLowerCase().includes(q)
      || (o.shippingAddress?.phone || '').includes(q);
  });

  const filteredRiderOrders = riderOrders.filter((o) => {
    if (!orderSearch) return true;
    const q = orderSearch.toLowerCase();
    return (o.orderNumber || '').toLowerCase().includes(q)
      || o._id?.toLowerCase().includes(q)
      || (o.shippingAddress?.city || '').toLowerCase().includes(q)
      || (o.shippingAddress?.name || o.shippingAddress?.fullName || '').toLowerCase().includes(q)
      || (o.shippingAddress?.phone || '').includes(q);
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rider Order Assignment</h1>
          <p className="text-sm text-gray-500 mt-1">Assign orders to riders and view current assignments</p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700 transition disabled:opacity-50"
        >Refresh</button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-pink-600" size={32} /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Rider list */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input type="text" placeholder="Search riders..." className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                  value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {approvedRiders.length > 0 && (
                <>
                  <div className="px-3 py-2 bg-green-50 text-xs font-semibold text-green-700 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Approved & Active ({approvedRiders.length})
                  </div>
                  {approvedRiders.map((rider) => (
                    <button key={rider._id} onClick={() => selectRider(rider)}
                      className={`w-full text-left px-3 py-3 hover:bg-gray-50 transition flex items-center gap-3 ${
                        selectedRider?._id === rider._id ? 'bg-pink-50 border-l-4 border-pink-600' : ''
                      }`}>
                      <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                        <Bike size={18} className="text-pink-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{rider.name}</p>
                        <p className="text-xs text-gray-500 truncate">{rider.email}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
              {otherRiders.length > 0 && (
                <>
                  <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-500">
                    Other Riders ({otherRiders.length})
                  </div>
                  {otherRiders.map((rider) => (
                    <button key={rider._id} onClick={() => selectRider(rider)}
                      className={`w-full text-left px-3 py-3 hover:bg-gray-50 transition flex items-center gap-3 opacity-60 ${
                        selectedRider?._id === rider._id ? 'bg-pink-50 border-l-4 border-pink-600' : ''
                      }`}>
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <Bike size={18} className="text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{rider.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{rider.status}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
              {filteredRiders.length === 0 && (
                <div className="py-8 text-center text-gray-400 text-sm">No riders found</div>
              )}
            </div>
          </div>

          {/* Right panel: Rider details + orders */}
          <div className="lg:col-span-2 space-y-4">
            {selectedRider ? (
              <>
                {/* Rider Info Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                        <User size={24} className="text-pink-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-800">{selectedRider.name}</h2>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1"><Phone size={14} />{selectedRider.phone || 'N/A'}</span>
                          <span className="text-gray-300">|</span>
                          <span className="capitalize">{selectedRider.vehicleType || 'bike'}</span>
                          {selectedRider.numberPlate && (
                            <>
                              <span className="text-gray-300">|</span>
                              <span className="uppercase font-mono text-xs">{selectedRider.numberPlate}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                      selectedRider.status === 'approved' ? 'bg-green-100 text-green-700' :
                      selectedRider.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedRider.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 border-t border-gray-100 pt-3">
                    <span>{selectedRider.totalDeliveries || 0} deliveries</span>
                    {selectedRider.currentLat && selectedRider.currentLng && (
                      <a href={`https://www.google.com/maps?q=${selectedRider.currentLat},${selectedRider.currentLng}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-pink-600 hover:underline">
                        <MapPin size={14} /> View Location
                      </a>
                    )}
                  </div>
                </div>

                {/* Assign New Order */}
                {unassignedOrders.length > 0 && selectedRider.status === 'approved' && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-700 mb-3">Assign New Order ({filteredUnassigned.length})</h3>
                    {assignError && (
                      <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-1">
                        <AlertCircle size={12} /> {assignError}
                      </div>
                    )}
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                      <input type="text" placeholder="Search orders by ID, city, customer..." value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none" />
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {filteredUnassigned.map((order) => (
                        <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800">
                              {order.orderNumber || `#${order._id?.slice(-6)}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              ₹{order.totalAmount} · {order.items?.length || 0} items · {order.shippingAddress?.city || ''}
                            </p>
                          </div>
                          <button onClick={() => handleAssign(order._id)} disabled={assigning}
                            className="px-3 py-1.5 bg-pink-600 text-white rounded-lg text-xs font-medium hover:bg-pink-700 transition disabled:opacity-50 flex items-center gap-1 shrink-0">
                            {assigning ? <Loader2 className="animate-spin" size={12} /> : null}
                            Assign
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Current Orders */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Package size={16} />
                      Current Orders ({riderOrders.length})
                    </h3>
                    {riderOrders.length > 0 && (
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input type="text" placeholder="Search assigned orders..." value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none" />
                      </div>
                    )}
                  {ordersLoading ? (
                    <div className="flex justify-center py-6"><Loader2 className="animate-spin text-pink-600" size={24} /></div>
                  ) : filteredRiderOrders.length === 0 ? (
                    <p className="text-center py-6 text-gray-400 text-sm">{orderSearch ? 'No orders match your search' : 'No orders assigned to this rider'}</p>
                  ) : (
                    <div className="space-y-2">
                      {filteredRiderOrders.map((order) => (
                        <div key={order._id} className="border border-gray-200 rounded-lg p-3 hover:border-pink-200 transition">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">
                                {order.orderNumber || `#${order._id?.slice(-6)}`}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {order.items?.length} item{order.items?.length !== 1 ? 's' : ''} · ₹{order.totalAmount}
                              </p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                              order.riderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                              order.riderStatus === 'assigned' ? 'bg-rose-100 text-rose-600' :
                              order.riderStatus === 'picked_up' ? 'bg-pink-100 text-pink-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {order.riderStatus?.replace(/_/g, ' ') || 'assigned'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <MapPin size={12} />
                              {order.shippingAddress?.city || 'N/A'}, {order.shippingAddress?.state || ''}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {order.assignedAt ? new Date(order.assignedAt).toLocaleDateString() : '-'}
                            </span>
                          </div>
                          {order.shippingAddress && (
                            <div className="mt-1 text-xs text-gray-500">
                              {order.shippingAddress.addressLine1}, {order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + ', ' : ''}
                              {order.shippingAddress.city} - {order.shippingAddress.pincode}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-xl shadow-sm border border-gray-200">
                <Bike size={48} className="mb-3 opacity-30" />
                <p className="font-medium text-gray-500">Select a rider</p>
                <p className="text-sm mt-1">Choose a rider from the left panel to view and assign orders</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderOrderAssignment;
