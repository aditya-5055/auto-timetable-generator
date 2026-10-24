import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { Trash2, Plus, X, AlertCircle, CheckCircle2 } from 'lucide-react';

const Sections = () => {
  const [sections, setSections] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();

  // Watch selected course to show Division or Batch conditionally
  const watchCourseNumber = watch('courseNumber', '');
  const selectedCourse = courses.find(c => c.courseNumber === watchCourseNumber);
  const showDivision = selectedCourse ? selectedCourse.courseType === 'LECTURE' : false;
  const showBatch = selectedCourse ? selectedCourse.courseType === 'LAB' : false;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [secRes, deptRes, divRes, batchRes, courseRes] = await Promise.all([
        api.get('/sections'),
        api.get('/departments'),
        api.get('/divisions'),
        api.get('/batches'),
        api.get('/courses')
      ]);
      setSections(secRes.data);
      setDepartments(deptRes.data);
      setDivisions(divRes.data);
      setBatches(batchRes.data);
      setCourses(courseRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch section configurations');
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
      await api.post('/sections', {
        sectionId: data.sectionId.trim(),
        departmentId: parseInt(data.departmentId, 10),
        numClassInWeek: parseInt(data.numClassInWeek, 10),
        courseNumber: data.courseNumber,
        divisionId: showDivision && data.divisionId ? parseInt(data.divisionId, 10) : null,
        batchId: showBatch && data.batchId ? parseInt(data.batchId, 10) : null,
        isElective: !!data.isElective,
        electiveGroup: data.electiveGroup || null
      });

      setSuccess('Section added successfully!');
      reset();
      setIsModalOpen(false);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create section config');
    }
  };

  const handleDelete = async (sectionId) => {
    if (!window.confirm(`Are you sure you want to delete section ${sectionId}?`)) {
      return;
    }
    try {
      setError(null);
      await api.delete(`/sections/${sectionId}`);
      setSuccess('Section deleted successfully!');
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete section');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Sections Configuration</h2>
          <p className="text-sm text-slate-400">Configure weekly class sessions and link them to subjects.</p>
        </div>
        <button
          disabled={courses.length === 0 || departments.length === 0}
          onClick={() => { reset(); setError(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 transition duration-150 disabled:opacity-50"
        >
          <Plus size={16} />
          Add Section
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
          <div className="p-8 text-center text-slate-400">Loading configurations...</div>
        ) : sections.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No sections configured yet.</div>
        ) : (
          <table className="w-full border-collapse text-left text-sm text-slate-300">
            <thead className="bg-slate-900 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Section ID</th>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Target Group</th>
                <th className="px-6 py-4 text-center">Classes / Week</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sections.map((sec) => (
                <tr key={sec.sectionId} className="hover:bg-slate-800/30 transition duration-150">
                  <td className="px-6 py-4 font-mono font-semibold text-slate-200">{sec.sectionId}</td>
                  <td className="px-6 py-4 text-slate-300">
                    <div>{sec.course?.courseName}</div>
                    <div className="text-xs text-slate-500 font-mono">{sec.courseNumber}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-400">{sec.department?.deptName}</td>
                  <td className="px-6 py-4 text-slate-300">
                    {sec.isElective ? (
                      <span className="rounded bg-indigo-950/70 border border-indigo-900/50 px-2 py-0.5 text-xs text-indigo-400">
                        Elective {sec.electiveGroup ? `(${sec.electiveGroup})` : ''}
                      </span>
                    ) : sec.divisionId ? (
                      <span>Div: {sec.division?.divisionName}</span>
                    ) : sec.batchId ? (
                      <span>Batch: {sec.batch?.batchName}</span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-slate-400">{sec.numClassInWeek}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(sec.sectionId)}
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
              <h3 className="text-lg font-bold text-slate-100">Add New Section Config</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Section ID</label>
                <input
                  type="text"
                  placeholder="e.g. CC-G1 or TE-I-AI"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-indigo-600 focus:outline-none transition duration-150"
                  {...register('sectionId', { required: 'Section ID is required' })}
                />
                {errors.sectionId && (
                  <span className="text-xs text-red-400">{errors.sectionId.message}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Department</label>
                  <select
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-600 focus:outline-none"
                    {...register('departmentId', { required: 'Department is required' })}
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.deptName}</option>
                    ))}
                  </select>
                  {errors.departmentId && (
                    <span className="text-xs text-red-400">{errors.departmentId.message}</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Classes Per Week</label>
                  <input
                    type="number"
                    placeholder="3"
                    defaultValue="3"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-600"
                    {...register('numClassInWeek', {
                      required: 'Required',
                      min: { value: 1, message: 'Min 1' },
                      max: { value: 10, message: 'Max 10' }
                    })}
                  />
                  {errors.numClassInWeek && (
                    <span className="text-xs text-red-400">{errors.numClassInWeek.message}</span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Associated Course</label>
                <select
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-600"
                  {...register('courseNumber', { required: 'Course is required' })}
                >
                  <option value="">Select Course</option>
                  {courses.map((c) => (
                    <option key={c.courseNumber} value={c.courseNumber}>
                      {c.courseName} ({c.courseType === 'LECTURE' ? 'Theory' : 'Lab'})
                    </option>
                  ))}
                </select>
                {errors.courseNumber && (
                  <span className="text-xs text-red-400">{errors.courseNumber.message}</span>
                )}
              </div>

              {/* Conditional rendering for Division (Lecture) */}
              {showDivision && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Division (For Lectures)</label>
                  <select
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-600"
                    {...register('divisionId', { required: 'Division is required for theory courses' })}
                  >
                    <option value="">Select Division</option>
                    {divisions.map((div) => (
                      <option key={div.id} value={div.id}>{div.divisionName}</option>
                    ))}
                  </select>
                  {errors.divisionId && (
                    <span className="text-xs text-red-400">{errors.divisionId.message}</span>
                  )}
                </div>
              )}

              {/* Conditional rendering for Batch (Lab) */}
              {showBatch && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Batch (For Lab Practicals)</label>
                  <select
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-600"
                    {...register('batchId', { required: 'Batch is required for lab courses' })}
                  >
                    <option value="">Select Batch</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.batchName} ({b.division?.divisionName})
                      </option>
                    ))}
                  </select>
                  {errors.batchId && (
                    <span className="text-xs text-red-400">{errors.batchId.message}</span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="secElective"
                  className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-600"
                  {...register('isElective')}
                />
                <label htmlFor="secElective" className="text-sm font-medium text-slate-300">
                  This section is an Elective
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Elective Group Choice (Optional)</label>
                <select
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-600"
                  {...register('electiveGroup')}
                >
                  <option value="">None</option>
                  <option value="G1">G1 (TE-I & TE-II)</option>
                  <option value="G2">G2 (TE-III & TE-IV)</option>
                </select>
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

export default Sections;
