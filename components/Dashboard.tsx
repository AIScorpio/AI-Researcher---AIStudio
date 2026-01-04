import React, { useMemo } from 'react';
import { Paper, BankingDomain, AIDomain, Methodology } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Database } from 'lucide-react';

interface DashboardProps {
  papers: Paper[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const Dashboard: React.FC<DashboardProps> = ({ papers }) => {
  const navigate = useNavigate();

  const domainData = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(BankingDomain).forEach(d => counts[d] = 0);
    papers.forEach(p => {
      counts[p.bankingDomain] = (counts[p.bankingDomain] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] })).filter(x => x.value > 0);
  }, [papers]);

  const methodData = useMemo(() => {
      const counts: Record<string, number> = {};
      Object.values(Methodology).forEach(m => counts[m] = 0);
      papers.forEach(p => {
          counts[p.methodology] = (counts[p.methodology] || 0) + 1;
      });
      return Object.keys(counts).map(key => ({ name: key, value: counts[key] })).filter(x => x.value > 0);
  }, [papers]);

  const techTrendData = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(AIDomain).forEach(d => counts[d] = 0);
    papers.forEach(p => {
      counts[p.aiDomain] = (counts[p.aiDomain] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] })).sort((a,b) => b.value - a.value);
  }, [papers]);

  // Empty State View
  if (papers.length === 0) {
      return (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-slate-800 rounded-xl border border-slate-700">
              <div className="bg-slate-900 p-6 rounded-full mb-6 border border-slate-700">
                  <Database size={48} className="text-slate-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Repository is Empty</h2>
              <p className="text-slate-400 max-w-md mb-8">
                  Your research nexus is ready. Start by running the collection agent to find, categorize, and store banking AI research papers.
              </p>
              <button 
                  onClick={() => navigate('/collect')}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition"
              >
                  <PlayCircle size={20} />
                  Run Collection Agent
              </button>
              <p className="text-xs text-slate-500 mt-4">
                  Note: The daily batch job will also run automatically in the background.
              </p>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <p className="text-slate-400 text-sm">Total Papers</p>
          <p className="text-3xl font-bold text-white">{papers.length}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
            <p className="text-slate-400 text-sm">Favorites</p>
            <p className="text-3xl font-bold text-amber-500">{papers.filter(p => p.isFavorite).length}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
            <p className="text-slate-400 text-sm">New this Month</p>
            <p className="text-3xl font-bold text-emerald-500">
                {papers.filter(p => new Date(p.collectedAt).getMonth() === new Date().getMonth()).length}
            </p>
        </div>
         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
            <p className="text-slate-400 text-sm">Avg Citations</p>
            <p className="text-3xl font-bold text-blue-500">
                {papers.length > 0 ? Math.floor(papers.reduce((acc, p) => acc + p.citationCount, 0) / papers.length) : 0}
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Banking Domain Distribution */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm min-h-[400px]">
          <h3 className="text-lg font-semibold text-white mb-4">Research by Banking Sector</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={domainData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                onClick={(data) => navigate(`/library?filter=${encodeURIComponent(data.name)}`)}
                cursor="pointer"
              >
                {domainData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* AI Tech Distribution */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm min-h-[400px]">
            <h3 className="text-lg font-semibold text-white mb-4">Top AI Techniques</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={techTrendData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" />
                    <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" style={{fontSize: '10px'}} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                        cursor={{fill: '#334155', opacity: 0.4}}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} onClick={(data) => navigate(`/library?filter=${encodeURIComponent(data.name)}`)} cursor="pointer">
                         {techTrendData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>

        {/* Methodology Distribution */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm min-h-[400px] lg:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4">Research Methodology Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={methodData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                         contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                         cursor={{fill: '#334155', opacity: 0.4}}
                    />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} onClick={(data) => navigate(`/library`)} cursor="pointer" barSize={60} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;