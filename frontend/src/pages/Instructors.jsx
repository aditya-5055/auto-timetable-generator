import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { Trash2, Plus, X, AlertCircle, CheckCircle2 } from 'lucide-react';

const Instructors = () => {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/instructors');
      setInstructors(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch instructors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  const onSubmit = async (data) => {
    try {
      setError(null);
      await api.post('/instructors', {
        uid: data.uid,
        name: data.name,
        maxLecturesPerWeek: parseInt(data.maxLecturesPerWeek, 10),
        maxLabsPerWeek: parseInt(data.maxLabsPerWeek, 10)
      });
      setSuccess('Instructor added successfully!');
      reset();
      setIsModalOpen(false);
      fetchInstructors();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create instructor');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this instructor? This will cascade delete their course associations and sections.')) {
      return;
    }
    try {
      setError(null);
      await api.delete(`/instructors/${id}`);
      setSuccess('Instructor deleted successfully!');
      fetchInstructors();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete instructor');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Instructors</h2>
          <p className="text-sm text-slate-400">Manage teachers, their IDs, and their weekly lecture/lab limits.</p>
        </div>
        <button
          onClick={() => { reset(); setError(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 transition duration-150"
        >
          <Plus size={16} />
          Add Instructor
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
          <div className="p-8 text-center text-slate-400">Loading instructors...</div>
        ) : instructors.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No instructors added yet.</div>
        ) : (
          <table className="w-full border-collapse text-left text-sm text-slate-300">
            <thead className="bg-slate-900 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Teacher ID</th>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4 text-center">Max Lectures / Week</th>
                <th className="px-6 py-4 text-center">Max Labs / Week</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {instructors.map((instructor) => (
                <tr key={instructor.id} className="hover:bg-slate-800/30 transition duration-150">
                  <td className="px-6 py-4 font-mono font-semibold text-slate-400">{instructor.uid}</td>
                  <td className="px-6 py-4 font-semibold text-slate-200">{instructor.name}</td>
                  <td className="px-6 py-4 text-center font-mono text-slate-400">{instructor.maxLecturesPerWeek}</td>
                  <td className="px-6 py-4 text-center font-mono text-slate-400">{instructor.maxLabsPerWeek}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(instructor.id)}
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
              <h3 className="text-lg font-bold text-slate-100">Add New Instructor</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Teacher ID (uid)</label>
                <input
                  type="text"
                  placeholder="e.g. T001"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-indigo-600 focus:outline-none transition duration-150"
                  {...register('uid', {
                    required: 'Teacher ID (uid) is required',
                    maxLength: { value: 6, message: 'Teacher ID cannot exceed 6 characters' }
                  })}
                />
                {errors.uid && (
                  <span className="text-xs text-red-400">{errors.uid.message}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. A.B. Sharma"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-indigo-600 focus:outline-none transition duration-150"
                  {...register('name', { required: 'Teacher Name is required' })}
                />
                {errors.name && (
                  <span className="text-xs text-red-400">{errors.name.message}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Max Lectures / Week</label>
                  <input
                    type="number"
                    placeholder="3"
                    defaultValue="3"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-600 focus:outline-none"
                    {...register('maxLecturesPerWeek', {
                      required: 'Required',
                      min: { value: 0, message: 'Min 0' },
                      max: { value: 30, message: 'Max 30' }
                    })}
                  />
                  {errors.maxLecturesPerWeek && (
                    <span className="text-xs text-red-400">{errors.maxLecturesPerWeek.message}</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Max Labs / Week</label>
                  <input
                    type="number"
                    placeholder="3"
                    defaultValue="3"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-600 focus:outline-none"
                    {...register('maxLabsPerWeek', {
                      required: 'Required',
                      min: { value: 0, message: 'Min 0' },
                      max: { value: 20, message: 'Max 20' }
                    })}
                  />
                  {errors.maxLabsPerWeek && (
                    <span className="text-xs text-red-400">{errors.maxLabsPerWeek.message}</span>
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

export default Instructors;
