'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    // Prevent double submission if already processing
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const cleanCode = code.trim();

      if (!cleanCode) {
        setError('Please enter a valid login code.');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('evaluators')
        .select('id, full_name, role, is_active')
        .ilike('unique_code', cleanCode)
        .maybeSingle();

      if (fetchError) {
        setError(`Database Error: ${fetchError.message}`);
        setLoading(false);
        return;
      }

      if (!data) {
        setError('Invalid code: No matching evaluator found.');
        setLoading(false);
        return;
      }

      if (data.is_active === false) {
        setError('This evaluator account is inactive.');
        setLoading(false);
        return;
      }

      // 1. Synchronously save session data across both storage layers
      localStorage.setItem('evaluator_id', data.id);
      localStorage.setItem('evaluator_name', data.full_name);
      localStorage.setItem('evaluator_role', data.role);

      sessionStorage.setItem('evaluator_id', data.id);
      sessionStorage.setItem('evaluator_name', data.full_name);
      sessionStorage.setItem('evaluator_role', data.role);

      // 2. Perform a hard navigation to guarantee storage persistence and eliminate router bouncing
      const destination = data.role === 'Admin' ? '/admin/dashboard' : '/dashboard';
      window.location.href = destination;
    } catch (err: any) {
      setError(`Connection Error: ${err?.message || 'Failed to connect.'}`);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FDF0D0] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-amber-200/60">
        <div className="text-center mb-6">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Bicol University College of Engineering
          </h2>
          <h1 className="text-xl font-bold text-gray-900 mt-1">
            CSC Internal Evaluation Portal
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-semibold rounded break-words">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
              Unique Login Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., EXE-K93P7M2V"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E8760A] focus:outline-none uppercase tracking-wider text-sm text-gray-900 font-mono"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E8760A] hover:bg-[#d26807] text-white font-bold py-3 rounded-lg transition duration-200 disabled:opacity-50 shadow-sm text-sm"
          >
            {loading ? 'Redirecting to Dashboard...' : 'Access Portal'}
          </button>
        </form>
      </div>
    </div>
  );
}