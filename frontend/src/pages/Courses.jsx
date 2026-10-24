import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { Trash2, Plus, X, AlertCircle, CheckCircle2 } from 'lucide-react';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseResponse, instResponse] = await Promise.all([
        api.get('/courses'),
        api.get('/instructors')
      ]);
      setCourses(courseResponse.data);
      setInstructors(instResponse.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch course data');
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
      
      // Extract selected instructor IDs from multi-select array
      const selectedInstructors = Array.from(data.instructors || []).map(id => parseInt(id, 10));

      await api.post('/courses', {
        courseNumber: data.courseNumber,
        courseName: data.courseName,
        maxNumbStudents: parseInt(data.maxNumbStudents, 10),
        courseType: data.courseType,
        isElective: !!data.isElective,
        instructors: selectedInstructors
      });

      setSuccess('Course added successfully!');
      reset();
      setIsModalOpen(false);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create course');
    }
  };

  const handleDelete = async (courseNumber) => {
    if (!window.confirm(`Are you sure you want to delete course ${courseNumber}? This will cascade delete its section configurations.`)) {
      return;
    }
    try {
      setError(null);
      await api.delete(`/courses/${courseNumber}`);
      setSuccess('Course deleted successfully!');
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete course');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Courses</h2>
          <p className="text-sm text-slate-400">Manage academic subjects, types, and eligible teachers.</p>
        </div>
        <button
          onClick={() => { reset(); setError(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 transition duration-150"
        >
          <Plus size={16} />
          Add Course
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
          <div className="p-8 text-center text-slate-400">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No courses added yet.</div>
        ) : (
          <table className="w-full border-collapse text-left text-sm text-slate-300">
            <thead className="bg-slate-900 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Course Code</th>
                <th className="px-6 py-4">Course Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Is Elective</th>
                <th className="px-6 py-4">Instructors</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {courses.map((course) => (
                <tr key={course.courseNumber} className="hover:bg-slate-800/30 transition duration-150">
                  <td className="px-6 py-4 font-mono font-semibold text-slate-200">{course.courseNumber}</td>
                  <td className="px-6 py-4 text-slate-300 font-medium">{course.courseName}</td>
                  <td className="px-6 py-4 text-xs font-semibold uppercase">
                    {course.courseType === 'LECTURE' ? (
                      <span className="rounded bg-sky-950 px-2 py-0.5 text-sky-400 border border-sky-900/50">Theory</span>
                    ) : (
                      <span className="rounded bg-emerald-950 px-2 py-0.5 text-emerald-400 border border-emerald-900/50">Practical</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-400">
                    {course.isElective ? (
                      <span className="text-indigo-400 font-semibold">Yes</span>
                    ) : (
                      <span className="text-slate-600">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate">
                    {course.instructors && course.instructors.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {course.instructors.map((inst) => (
                          <span key={inst.id} className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                            {inst.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-red-400/70 italic">No instructors assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(course.courseNumber)}
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
              <h3 className="text-lg font-bold text-slate-100">Add New Course</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Course Code (Max 8 characters)</label>
                <input
                  type="text"
                  placeholder="e.g. DSBDAL"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-indigo-600 focus:outline-none transition duration-150"
                  {...register('courseNumber', {
                    required: 'Course code is required',
                    maxLength: { value: 8, message: 'Cannot exceed 8 characters' }
                  })}
                />
                {errors.courseNumber && (
                  <span className="text-xs text-red-400">{errors.courseNumber.message}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Course Name</label>
                <input
                  type="text"
                  placeholder="e.g. Data Science and Big Data Analytics"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-indigo-600 focus:outline-none transition duration-150"
                  {...register('courseName', { required: 'Course Name is required' })}
                />
                {errors.courseName && (
                  <span className="text-xs text-red-400">{errors.courseName.message}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Max Students</label>
                  <input
                    type="number"
                    placeholder="88"
                    defaultValue="88"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-600 focus:outline-none"
                    {...register('maxNumbStudents', {
                      required: 'Required',
                      min: { value: 1, message: 'Min 1' }
                    })}
                  />
                  {errors.maxNumbStudents && (
                    <span className="text-xs text-red-400">{errors.maxNumbStudents.message}</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Course Type</label>
                  <select
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-600 focus:outline-none"
                    {...register('courseType', { required: 'Course Type is required' })}
                  >
                    <option value="LECTURE">Theory (Lecture)</option>
                    <option value="LAB">Practical (Lab)</option>
                  </select>
                  {errors.courseType && (
                    <span className="text-xs text-red-400">{errors.courseType.message}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isElective"
                  className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-600"
                  {...register('isElective')}
                />
                <label htmlFor="isElective" className="text-sm font-medium text-slate-300">
                  This is an Elective Course
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Qualified Instructors</label>
                <select
                  multiple
                  size="5"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-600 focus:outline-none"
                  {...register('instructors')}
                >
                  {instructors.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.uid})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple teachers.</p>
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

export default Courses;
