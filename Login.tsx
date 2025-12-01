
import React, { useState } from 'react';
import { login } from '../services/authService';
import { User } from '../types';
import { motion } from 'framer-motion';
import { LockKey, EnvelopeSimple, Spinner } from '@phosphor-icons/react';

const MotionDiv = motion.div as any;

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = await login(email, password);
      // Simulate session storage
      localStorage.setItem('app_session', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-dark-bg relative overflow-hidden">
      {/* Background Effects matching index.html/App styling */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand/20 rounded-full blur-[100px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-900/20 rounded-full blur-[100px]" />
      </div>

      <MotionDiv
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 glass-panel rounded-2xl shadow-2xl relative z-10 border border-white/10"
      >
        <div className="text-center mb-8">
           <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-3xl font-bold text-brand tracking-tighter">Applus<sup className="text-xs align-top border border-brand rounded-full px-[1px] ml-0.5 text-brand font-bold">+</sup></span>
              <span className="text-3xl font-light text-white tracking-widest uppercase">VELOSI</span>
           </div>
           <p className="text-xs text-gray-500 uppercase tracking-widest">Commercial Quotation Engine</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
           <div>
             <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Email Address</label>
             <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                 <EnvelopeSimple size={18} />
               </div>
               <input
                 type="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder-gray-600"
                 placeholder="admin@applus.com"
                 required
               />
             </div>
           </div>

           <div>
             <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Password</label>
             <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                 <LockKey size={18} />
               </div>
               <input
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder-gray-600"
                 placeholder="••••••••"
                 required
               />
             </div>
           </div>

           {error && (
             <motion.div
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: 'auto' }}
               className="text-red-500 text-xs text-center bg-red-500/10 border border-red-500/20 rounded p-2"
             >
               {error}
             </motion.div>
           )}

           <button
             type="submit"
             disabled={isLoading}
             className="w-full bg-brand hover:bg-brand-light text-black font-bold py-3 px-4 rounded-lg shadow-lg shadow-brand/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
           >
             {isLoading ? <Spinner className="animate-spin" size={20} /> : 'Sign In'}
           </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-gray-600">
             Authorized Personnel Only. <br/>
             &copy; 2025 Applus Velosi.
          </p>
        </div>
      </MotionDiv>
    </div>
  );
};

export default Login;
