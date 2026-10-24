import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { Trash2, Plus, X, AlertCircle, CheckCircle2 } from 'lucide-react';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/departments');
      setDepartments(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const onSubmit = async (data) => {
    try {
      setError(null);
      await api.post('/departments', { deptName: data.deptName });
      setSuccess('Department added successfully!');
      reset();
      setIsModalOpen(false);
      fetchDepartments();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create department');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department? This will cascade delete its divisions, batches, and sections.')) {
      return;
    }
    try {
      setError(null);
      await api.delete(`/departments/${id}`);
      setSuccess('Department deleted successfully!');
      fetchDepartments();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete department');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Departments</h2>
          <p className="text-sm text-slate-400">Manage academic department departments.</p>
        </div>
        <button
          onClick={() => { reset(); setError(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 transition duration-150"
        >
          <Plus size={16} />
          Add Department
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
          <div className="p-8 text-center text-slate-400">Loading departments...</div>
        ) : departments.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No departments added yet.</div>
        ) : (
          <table className="w-full border-collapse text-left text-sm text-slate-300">
            <thead className="bg-slate-900 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Department ID</th>
                <th className="px-6 py-4">Department Name</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-slate-800/30 transition duration-150">
                  <td className="px-6 py-4 font-mono text-slate-400">{dept.id}</td>
                  <td className="px-6 py-4 font-semibold text-slate-200">{dept.deptName}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(dept.id)}
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
              <h3 className="text-lg font-bold text-slate-100">Add New Department</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Department Name</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Engineering"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-indigo-600 focus:outline-none transition duration-150"
                  {...register('deptName', { required: 'Department Name is required' })}
                />
                {errors.deptName && (
                  <span className="text-xs text-red-400">{errors.deptName.message}</span>
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

export default Departments;
