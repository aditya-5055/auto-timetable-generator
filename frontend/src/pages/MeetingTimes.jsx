import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { Trash2, Plus, X, AlertCircle, CheckCircle2 } from 'lucide-react';

const MeetingTimes = () => {
  const [meetingTimes, setMeetingTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchMeetingTimes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/meeting-times');
      setMeetingTimes(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch meeting times');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetingTimes();
  }, []);

  const onSubmit = async (data) => {
    try {
      setError(null);
      await api.post('/meeting-times', {
        pid: data.pid,
        time: data.time,
        day: data.day,
        slotType: data.slotType
      });
      setSuccess('Meeting time added successfully!');
      reset();
      setIsModalOpen(false);
      fetchMeetingTimes();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create meeting time');
    }
  };

  const handleDelete = async (pid) => {
    if (!window.confirm(`Are you sure you want to delete meeting slot ${pid}? This will cascade delete its section configurations.`)) {
      return;
    }
    try {
      setError(null);
      await api.delete(`/meeting-times/${pid}`);
      setSuccess('Meeting time deleted successfully!');
      fetchMeetingTimes();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete meeting time');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Meeting Times</h2>
          <p className="text-sm text-slate-400">Define daily timeline schedules and durations for lectures and labs.</p>
        </div>
        <button
          onClick={() => { reset(); setError(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 transition duration-150"
        >
          <Plus size={16} />
          Add Time Slot
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
          <div className="p-8 text-center text-slate-400">Loading meeting times...</div>
        ) : meetingTimes.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No meeting times added yet.</div>
        ) : (
          <table className="w-full border-collapse text-left text-sm text-slate-300">
            <thead className="bg-slate-900 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Slot ID</th>
                <th className="px-6 py-4">Day</th>
                <th className="px-6 py-4">Time Slot</th>
                <th className="px-6 py-4">Slot Type</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {meetingTimes.map((mt) => (
                <tr key={mt.pid} className="hover:bg-slate-800/30 transition duration-150">
                  <td className="px-6 py-4 font-mono font-semibold text-slate-400">{mt.pid}</td>
                  <td className="px-6 py-4 text-slate-200 font-medium">{mt.day}</td>
                  <td className="px-6 py-4 font-mono text-slate-300">{mt.time}</td>
                  <td className="px-6 py-4 text-xs font-semibold uppercase">
                    {mt.slotType === 'LECTURE' ? (
                      <span className="rounded bg-sky-950 px-2.5 py-0.5 text-sky-400 border border-sky-900/50">1-Hour Lecture</span>
                    ) : (
                      <span className="rounded bg-emerald-950 px-2.5 py-0.5 text-emerald-400 border border-emerald-900/50">2-Hour Lab</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(mt.pid)}
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
              <h3 className="text-lg font-bold text-slate-100">Add New Time Slot</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Meeting ID (pid - Max 4 chars)</label>
                <input
                  type="text"
                  placeholder="e.g. L001 or E001"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-indigo-600 focus:outline-none transition duration-150"
                  {...register('pid', {
                    required: 'Meeting ID is required',
                    maxLength: { value: 4, message: 'Cannot exceed 4 characters' }
                  })}
                />
                {errors.pid && (
                  <span className="text-xs text-red-400">{errors.pid.message}</span>
                )}
                <p className="text-xs text-slate-500">Note: Use ID starting with 'E' for elective 2-hour slots.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Time Range</label>
                <input
                  type="text"
                  placeholder="e.g. 08:45 - 09:45"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-indigo-600 focus:outline-none transition duration-150"
                  {...register('time', { required: 'Time slot duration is required' })}
                />
                {errors.time && (
                  <span className="text-xs text-red-400">{errors.time.message}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Day</label>
                  <select
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-600"
                    {...register('day', { required: 'Day is required' })}
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                  </select>
                  {errors.day && (
                    <span className="text-xs text-red-400">{errors.day.message}</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Slot Type</label>
                  <select
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-600"
                    {...register('slotType', { required: 'Slot Type is required' })}
                  >
                    <option value="LECTURE">1-hour Lecture Slot</option>
                    <option value="LAB">2-hour Lab Slot</option>
                  </select>
                  {errors.slotType && (
                    <span className="text-xs text-red-400">{errors.slotType.message}</span>
                  )}
                </div>
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

export default MeetingTimes;
