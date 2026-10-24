'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: fetchError } = await supabase
      .from('evaluators')
      .select('id, full_name, role, is_active')
      .eq('unique_code', code.trim())
      .single();

    if (fetchError || !data) {
      setError('Invalid or expired login code. Please try again.');
      setLoading(false);
      return;
    }

    if (!data.is_active) {
      setError('This account has been deactivated.');
      setLoading(false);
      return;
    }

    sessionStorage.setItem('evaluator_id', data.id);
    sessionStorage.setItem('evaluator_name', data.full_name);
    sessionStorage.setItem('evaluator_role', data.role);

    if (data.role === 'Admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div className="min-h-screen bg-[#FDF0D0] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          {/* Official Logo Display */}
          <img 
            src="/logo.png" 
            alt="BUCENG Logo" 
            className="w-24 h-24 mx-auto mb-3 object-contain" 
          />
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Bicol University</h2>
          <h1 className="text-xl font-bold text-gray-900 mt-1">CSC Internal Evaluation Portal</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Unique Login Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="E.G. EVAL-9A82"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E8760A] focus:outline-none uppercase"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E8760A] hover:bg-[#d26807] text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-50 shadow-sm"
          >
            {loading ? 'Validating...' : 'Access Portal'}
          </button>
        </form>
      </div>
    </div>
  );
}