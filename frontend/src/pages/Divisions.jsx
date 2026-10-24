import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { Trash2, Plus, X, AlertCircle, CheckCircle2 } from 'lucide-react';

const Divisions = () => {
  const [divisions, setDivisions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [divResponse, deptResponse] = await Promise.all([
        api.get('/divisions'),
        api.get('/departments')
      ]);
      setDivisions(divResponse.data);
      setDepartments(deptResponse.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch divisions data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data) => {
    try {
      setError(null);
      await api.post('/divisions', {
        divisionName: data.divisionName,
        departmentId: parseInt(data.departmentId, 10),
        totalStudents: parseInt(data.totalStudents, 10),
        electiveGroup: data.electiveGroup || null
      });
      setSuccess('Division added successfully!');
      reset();
      setIsModalOpen(false);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create division');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this division? This will cascade delete its batches and sections.')) {
      return;
    }
    try {
      setError(null);
      await api.delete(`/divisions/${id}`);
      setSuccess('Division deleted successfully!');
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete division');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Divisions</h2>
          <p className="text-sm text-slate-400">Configure academic class divisions and elective associations.</p>
        </div>
        <button
          disabled={departments.length === 0}
          onClick={() => { reset(); setError(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          Add Division
        </button>
      </div>

      {departments.length === 0 && !loading && (
        <div className="flex items-center gap-3 rounded-lg bg-amber-950/30 border border-amber-900/30 p-4 text-sm text-amber-400">
          <AlertCircle size={18} />
          <span>You must create at least one Department before you can add Divisions.</span>
        </div>
      )}

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
          <div className="p-8 text-center text-slate-400">Loading divisions...</div>
        ) : divisions.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No divisions added yet.</div>
        ) : (
          <table className="w-full border-collapse text-left text-sm text-slate-300">
            <thead className="bg-slate-900 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Division Name</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4 text-center">Total Students</th>
                <th className="px-6 py-4">Elective Group</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {divisions.map((div) => (
                <tr key={div.id} className="hover:bg-slate-800/30 transition duration-150">
                  <td className="px-6 py-4 font-semibold text-slate-200">{div.divisionName}</td>
                  <td className="px-6 py-4 text-slate-300">{div.department?.deptName || 'Unknown'}</td>
                  <td className="px-6 py-4 text-center font-mono text-slate-400">{div.totalStudents}</td>
                  <td className="px-6 py-4">
                    {div.electiveGroup ? (
                      <span className="rounded bg-indigo-950/50 border border-indigo-900/50 px-2.5 py-0.5 text-xs font-medium text-indigo-400">
                        {div.electiveGroup}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(div.id)}
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
              <h3 className="text-lg font-bold text-slate-100">Add New Division</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Division Name</label>
                <input
                  type="text"
                  placeholder="e.g. SY-I"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-indigo-600 focus:outline-none transition duration-150"
                  {...register('divisionName', { required: 'Division Name is required' })}
                />
                {errors.divisionName && (
                  <span className="text-xs text-red-400">{errors.divisionName.message}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Department</label>
                <select
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-600 focus:outline-none transition duration-150"
                  {...register('departmentId', { required: 'Department is required' })}
                >
                  <option value="">Select a Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.deptName}</option>
                  ))}
                </select>
                {errors.departmentId && (
                  <span className="text-xs text-red-400">{errors.departmentId.message}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Total Students</label>
                <input
                  type="number"
                  placeholder="88"
                  defaultValue="88"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-indigo-600 focus:outline-none transition duration-150"
                  {...register('totalStudents', {
                    required: 'Total Students count is required',
                    min: { value: 1, message: 'Must be at least 1 student' }
                  })}
                />
                {errors.totalStudents && (
                  <span className="text-xs text-red-400">{errors.totalStudents.message}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Elective Group (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. G1 (leave blank if none)"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-indigo-600 focus:outline-none transition duration-150"
                  {...register('electiveGroup')}
                />
                <p className="text-xs text-slate-500">Only for elective classes. Divisions with the same elective group share timeslots.</p>
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

export default Divisions;
