import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Library, PlayCircle, LogOut, User as UserIcon, MessageSquareText, Settings } from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
    children: React.ReactNode;
    user: User;
    onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
    const location = useLocation();

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/library', icon: Library, label: 'Repository' },
        { path: '/assistant', icon: MessageSquareText, label: 'AI Assistant' },
        { path: '/collect', icon: PlayCircle, label: 'Pipeline' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-slate-900">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold text-white tracking-tight">BankAI <span className="text-blue-500">Nexus</span></h1>
                    <p className="text-xs text-slate-500 mt-1">Applied Research Div.</p>
                </div>

                <nav className="flex-grow p-4 space-y-2">
                    {navItems.map(item => (
                        <Link 
                            key={item.path} 
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                                location.pathname === item.path 
                                ? 'bg-blue-900/30 text-blue-400 border border-blue-900' 
                                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                            }`}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="bg-slate-800 p-2 rounded-full">
                            <UserIcon size={16} className="text-slate-400" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{user.name}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-red-400 transition py-2 hover:bg-slate-900 rounded-lg"
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow overflow-auto p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;