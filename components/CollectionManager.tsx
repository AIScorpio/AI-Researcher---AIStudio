import React, { useState, useEffect } from 'react';
import { SearchCriteria, CollectionStatus } from '../types';
import { optimizeSearchQuery, collectPapersFromWeb } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { Loader2, Search, CheckCircle, AlertCircle, Sparkles, Plus, X, Globe, AlertTriangle } from 'lucide-react';

interface CollectionManagerProps {
    onComplete: () => void;
}

const CollectionManager: React.FC<CollectionManagerProps> = ({ onComplete }) => {
    const [criteria, setCriteria] = useState<SearchCriteria>({
        topic: '',
        sources: '', 
        dateRange: 'Past Year',
        useLLMOptimization: true
    });
    
    const [availableSources, setAvailableSources] = useState<string[]>([]);
    const [newSourceInput, setNewSourceInput] = useState('');
    
    const [status, setStatus] = useState<CollectionStatus>('idle');
    const [logs, setLogs] = useState<string[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [foundCount, setFoundCount] = useState(0);

    useEffect(() => {
        setAvailableSources(storageService.getSources());
    }, []);

    const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

    const handleAddSource = () => {
        if (newSourceInput.trim()) {
            const updated = storageService.addSource(newSourceInput.trim());
            setAvailableSources(updated);
            setNewSourceInput('');
        }
    };

    const handleRemoveSource = (s: string) => {
        const updated = storageService.removeSource(s);
        setAvailableSources(updated);
    };

    const handleRunCollection = async () => {
        if (!criteria.topic) return;
        
        setStatus('optimizing');
        setLogs([]);
        setErrorMessage(null);
        setFoundCount(0);
        addLog("Initiating collection pipeline...");

        let finalQuery = criteria.topic;

        if (criteria.useLLMOptimization) {
            addLog("Agent: Optimizing search query with LLM...");
            finalQuery = await optimizeSearchQuery(criteria.topic, criteria.dateRange);
            addLog(`Agent: Optimized query -> "${finalQuery}"`);
        }

        setStatus('searching');
        addLog(`Agent: Searching ${availableSources.length > 0 ? availableSources.length + ' Sources' : 'Web'} & Classifying in parallel...`);
        
        let afterDate = undefined;
        const now = new Date();
        if (criteria.dateRange === 'Past Month') {
            now.setMonth(now.getMonth() - 1);
            afterDate = now.toISOString().split('T')[0];
        } else if (criteria.dateRange === 'Past Year') {
            now.setFullYear(now.getFullYear() - 1);
            afterDate = now.toISOString().split('T')[0];
        } else if (criteria.dateRange === 'Past 3 Years') {
            now.setFullYear(now.getFullYear() - 3);
            afterDate = now.toISOString().split('T')[0];
        }

        try {
            // ONE-PASS COLLECTION: Papers return fully classified
            const fullPapers = await collectPapersFromWeb(finalQuery, availableSources, afterDate);
            
            if (fullPapers.length === 0) {
                setStatus('error');
                const err = "No papers found matching criteria.";
                setErrorMessage(err);
                addLog(`Agent: ${err}`);
                return;
            }
            
            addLog(`Agent: Retrieved and Classified ${fullPapers.length} candidates.`);
            setFoundCount(fullPapers.length);

            setStatus('saving');
            let processed = 0;
            
            for (const p of fullPapers) {
                const saved = storageService.savePaper(p);
                if (saved) {
                    addLog(`Saved: "${p.title}" [${p.bankingDomain}]`);
                    processed++;
                } else {
                    addLog(`Skipped Duplicate: "${p.title}"`);
                }
            }

            if (processed === 0 && fullPapers.length > 0) {
                addLog("Warning: All papers were duplicates.");
                setStatus('completed');
            } else {
                setStatus('completed');
                addLog(`Success! Added ${processed} new papers to the repository.`);
                setTimeout(onComplete, 1500);
            }
        } catch (error: any) {
            setStatus('error');
            const msg = error.message || "Unknown error occurred.";
            setErrorMessage(msg);
            addLog(`CRITICAL ERROR: ${msg}`);
        }
    };

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="text-blue-400" /> 
                    Automated Research Pipeline
                </h2>
                <p className="text-slate-400 mt-1">Configure the agent to crawl, analyze, and categorize new publications.</p>
            </div>
            
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Controls */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Research Topic</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Generative AI in Fraud Detection"
                            value={criteria.topic}
                            onChange={e => setCriteria({...criteria, topic: e.target.value})}
                            disabled={status !== 'idle' && status !== 'completed' && status !== 'error'}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Sources Repository</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {availableSources.map(s => (
                                <span key={s} className="bg-slate-700 text-slate-200 text-xs px-2 py-1 rounded-md border border-slate-600 flex items-center gap-1">
                                    <Globe size={10} /> {s}
                                    <button onClick={() => handleRemoveSource(s)} className="hover:text-red-400 ml-1"><X size={12} /></button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                className="flex-grow bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
                                placeholder="Add source (e.g. Nature)"
                                value={newSourceInput}
                                onChange={e => setNewSourceInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddSource()}
                            />
                            <button 
                                onClick={handleAddSource}
                                className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg border border-slate-600"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Date Horizon</label>
                            <select 
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white outline-none"
                                value={criteria.dateRange}
                                onChange={e => setCriteria({...criteria, dateRange: e.target.value})}
                            >
                                <option>Past Month</option>
                                <option>Past Year</option>
                                <option>Past 3 Years</option>
                                <option>All Time</option>
                            </select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-300 mb-1">Optimization</label>
                             <div className="flex items-center h-10">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={criteria.useLLMOptimization}
                                        onChange={e => setCriteria({...criteria, useLLMOptimization: e.target.checked})}
                                        className="form-checkbox h-5 w-5 text-blue-600 rounded bg-slate-900 border-slate-600"
                                    />
                                    <span className="text-slate-300 text-sm">Use LLM Agent</span>
                                </label>
                             </div>
                        </div>
                    </div>

                    {status === 'error' && errorMessage && (
                        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 flex items-start gap-3">
                             <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                             <div className="text-red-200 text-sm">
                                <p className="font-bold">Collection Failed</p>
                                <p>{errorMessage}</p>
                             </div>
                        </div>
                    )}

                    <button
                        onClick={handleRunCollection}
                        disabled={!criteria.topic || (status !== 'idle' && status !== 'completed' && status !== 'error')}
                        className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
                            status === 'idle' || status === 'completed' || status === 'error'
                            ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                            : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        {status === 'idle' || status === 'completed' || status === 'error' ? (
                            <>
                                <Search size={20} /> Run Collection Agent
                            </>
                        ) : (
                            <>
                                <Loader2 className="animate-spin" size={20} /> Processing...
                            </>
                        )}
                    </button>
                </div>

                {/* Status Console */}
                <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm border border-slate-800 h-full min-h-[300px] flex flex-col">
                    <div className="text-slate-500 border-b border-slate-800 pb-2 mb-2 flex justify-between">
                        <span>PIPELINE LOGS</span>
                        <span className={`uppercase font-bold ${
                            status === 'completed' ? 'text-green-500' : 
                            status === 'error' ? 'text-red-500' : 
                            status === 'idle' ? 'text-slate-600' : 'text-blue-500 animate-pulse'
                        }`}>{status}</span>
                    </div>
                    <div className="flex-grow overflow-y-auto space-y-1 custom-scrollbar">
                        {logs.length === 0 && status === 'idle' && (
                            <div className="text-slate-700 italic">Waiting for input...</div>
                        )}
                        {logs.map((log, i) => (
                            <div key={i} className="text-slate-300 border-l-2 border-slate-800 pl-2 py-0.5">
                                <span className="text-slate-600 text-xs mr-2">[{new Date().toLocaleTimeString()}]</span>
                                {log}
                            </div>
                        ))}
                         {status === 'completed' && (
                            <div className="text-green-400 flex items-center gap-2 mt-4">
                                <CheckCircle size={16} /> Collection finished successfully.
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="text-red-400 flex items-center gap-2 mt-4">
                                <AlertCircle size={16} /> Collection stopped due to error.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CollectionManager;