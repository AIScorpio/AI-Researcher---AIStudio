import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { User } from '../types';
import { ShieldCheck } from 'lucide-react';

interface AuthProps {
    onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email && password) {
            // Simulation
            const user = storageService.login(email);
            onLogin(user);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="bg-blue-600 p-3 rounded-full">
                        <ShieldCheck size={32} className="text-white" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-center text-white mb-2">BankAI Research Nexus</h1>
                <p className="text-slate-400 text-center mb-8">Secure Access for Research Leads</p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-300 mb-1">Email Address</label>
                        <input 
                            type="email" 
                            required
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                            placeholder="researcher@bank.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-300 mb-1">Password</label>
                        <input 
                            type="password" 
                            required
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <button 
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition mt-4"
                    >
                        Access Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Auth;
