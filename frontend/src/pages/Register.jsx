import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { AlertCircle, Lock, User, Mail, UserPlus } from 'lucide-react';

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  
  const password = watch('password', '');

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/auth/register', {
        username: data.username,
        email: data.email,
        password: data.password
      });

      // Automatically log the user in after signing up
      login(response.data.token, response.data.user);
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/50 p-8 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col items-center gap-2 mb-8">
          <h2 className="text-3xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            TimetableGen
          </h2>
          <p className="text-sm text-slate-400">Create an administrator account</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-lg bg-red-950/30 border border-red-900/30 p-4 text-sm text-red-400 mb-6">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <User size={18} />
              </span>
              <input
                type="text"
                placeholder="Choose a username"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-10 pr-3 text-slate-100 placeholder:text-slate-650 focus:border-indigo-600 focus:outline-none transition"
                {...register('username', { 
                  required: 'Username is required',
                  minLength: { value: 3, message: 'Must be at least 3 characters' }
                })}
              />
            </div>
            {errors.username && (
              <span className="text-xs text-red-400">{errors.username.message}</span>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Mail size={18} />
              </span>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-10 pr-3 text-slate-100 placeholder:text-slate-650 focus:border-indigo-600 focus:outline-none transition"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                })}
              />
            </div>
            {errors.email && (
              <span className="text-xs text-red-400">{errors.email.message}</span>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Lock size={18} />
              </span>
              <input
                type="password"
                placeholder="Create a password"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-10 pr-3 text-slate-100 placeholder:text-slate-650 focus:border-indigo-600 focus:outline-none transition"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Must be at least 8 characters' }
                })}
              />
            </div>
            {errors.password && (
              <span className="text-xs text-red-400">{errors.password.message}</span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Confirm Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Lock size={18} />
              </span>
              <input
                type="password"
                placeholder="Confirm your password"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-10 pr-3 text-slate-100 placeholder:text-slate-650 focus:border-indigo-600 focus:outline-none transition"
                {...register('passwordConfirm', { 
                  required: 'Confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
              />
            </div>
            {errors.passwordConfirm && (
              <span className="text-xs text-red-400">{errors.passwordConfirm.message}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-500 transition disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
          >
            <UserPlus size={16} />
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
