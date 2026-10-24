import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { Trash2, Plus, X, AlertCircle, CheckCircle2 } from 'lucide-react';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  
  // Watch roomType to trigger re-validation of seatingCapacity
  const watchRoomType = watch('roomType', 'LECTURE');

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/rooms');
      setRooms(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const onSubmit = async (data) => {
    try {
      setError(null);
      await api.post('/rooms', {
        rNumber: data.rNumber,
        seatingCapacity: parseInt(data.seatingCapacity, 10),
        roomType: data.roomType
      });
      setSuccess('Room added successfully!');
      reset();
      setIsModalOpen(false);
      fetchRooms();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room? This will cascade remove its assignments.')) {
      return;
    }
    try {
      setError(null);
      await api.delete(`/rooms/${id}`);
      setSuccess('Room deleted successfully!');
      fetchRooms();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete room');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Rooms</h2>
          <p className="text-sm text-slate-400">Configure lecture halls and laboratories, keeping track of capacities.</p>
        </div>
        <button
          onClick={() => { reset(); setError(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 transition duration-150"
        >
          <Plus size={16} />
          Add Room
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg bg-red-950/30 border border-red-900/30 p-4 text-sm text-red-400">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 rounded-lg bg-emerald-950/30 border border-emerald-900/30 p-4 text-sm text-emerald-400">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* List Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading rooms...</div>
        ) : rooms.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No rooms added yet.</div>
        ) : (
          <table className="w-full border-collapse text-left text-sm text-slate-300">
            <thead className="bg-slate-900 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Room Number</th>
                <th className="px-6 py-4">Room Type</th>
                <th className="px-6 py-4 text-center">Seating Capacity</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-slate-800/30 transition duration-150">
                  <td className="px-6 py-4 font-mono font-semibold text-slate-200">{room.rNumber}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      room.roomType === 'LECTURE'
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-900/50'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-900/50'
                    }`}>
                      {room.roomType === 'LECTURE' ? 'Lecture Hall' : 'Laboratory'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-slate-300">{room.seatingCapacity}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(room.id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition duration-150"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-100">Add New Room</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Room Number</label>
                <input
                  type="text"
                  placeholder="e.g. A1-309"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-indigo-600 focus:outline-none transition duration-150"
                  {...register('rNumber', { required: 'Room Number is required' })}
                />
                {errors.rNumber && (
                  <span className="text-xs text-red-400">{errors.rNumber.message}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Room Type</label>
                <select
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-600 focus:outline-none transition duration-150"
                  {...register('roomType', { required: 'Room Type is required' })}
                >
                  <option value="LECTURE">Lecture Hall</option>
                  <option value="LAB">Laboratory</option>
                </select>
                {errors.roomType && (
                  <span className="text-xs text-red-400">{errors.roomType.message}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Seating Capacity</label>
                <input
                  type="number"
                  placeholder="e.g. 80"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-indigo-600 focus:outline-none transition duration-150"
                  {...register('seatingCapacity', {
                    required: 'Seating Capacity is required',
                    min: { value: 1, message: 'Capacity must be at least 1' },
                    validate: (value) => {
                      const capacity = parseInt(value, 10);
                      if (watchRoomType === 'LECTURE' && capacity < 80) {
                        return 'Lecture rooms must have a capacity of at least 80.';
                      }
                      if (watchRoomType === 'LAB' && capacity < 22) {
                        return 'Lab rooms must have a capacity of at least 22.';
                      }
                      return true;
                    }
                  })}
                />
                {errors.seatingCapacity && (
                  <span className="text-xs text-red-400">{errors.seatingCapacity.message}</span>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-850 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition duration-150"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;
