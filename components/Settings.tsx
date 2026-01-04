import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { LLMSettings, LLMProvider } from '../types';
import { Settings as SettingsIcon, Save, Server, Key, Cpu, AlertTriangle } from 'lucide-react';

const Settings: React.FC = () => {
    const [settings, setSettings] = useState<LLMSettings>(storageService.getSettings());
    const [message, setMessage] = useState<string | null>(null);

    const handleSave = () => {
        storageService.saveSettings(settings);
        setMessage("Configuration saved successfully.");
        setTimeout(() => setMessage(null), 3000);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700 flex items-center gap-3">
                    <div className="bg-blue-900/50 p-2 rounded-lg text-blue-400">
                        <SettingsIcon size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">System Configuration</h2>
                        <p className="text-slate-400 text-sm">Manage LLM Providers and API connections.</p>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Provider Selection */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Server size={18} className="text-slate-400" /> 
                            LLM Provider
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className={`
                                cursor-pointer border rounded-xl p-4 flex items-center gap-3 transition
                                ${settings.provider === 'gemini' 
                                    ? 'bg-blue-600/10 border-blue-500 ring-1 ring-blue-500' 
                                    : 'bg-slate-900 border-slate-600 hover:border-slate-500'}
                            `}>
                                <input 
                                    type="radio" 
                                    name="provider" 
                                    value="gemini"
                                    checked={settings.provider === 'gemini'}
                                    onChange={() => setSettings({...settings, provider: 'gemini'})}
                                    className="hidden"
                                />
                                <div className="flex-1">
                                    <div className="font-bold text-white">Google Gemini</div>
                                    <div className="text-xs text-slate-400">Uses System API Key (Default)</div>
                                </div>
                                {settings.provider === 'gemini' && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
                            </label>

                            <label className={`
                                cursor-pointer border rounded-xl p-4 flex items-center gap-3 transition
                                ${settings.provider === 'groq' 
                                    ? 'bg-purple-600/10 border-purple-500 ring-1 ring-purple-500' 
                                    : 'bg-slate-900 border-slate-600 hover:border-slate-500'}
                            `}>
                                <input 
                                    type="radio" 
                                    name="provider" 
                                    value="groq"
                                    checked={settings.provider === 'groq'}
                                    onChange={() => setSettings({...settings, provider: 'groq'})}
                                    className="hidden"
                                />
                                <div className="flex-1">
                                    <div className="font-bold text-white">Groq API</div>
                                    <div className="text-xs text-slate-400">High-performance Inference</div>
                                </div>
                                {settings.provider === 'groq' && <div className="w-3 h-3 bg-purple-500 rounded-full"></div>}
                            </label>
                        </div>
                    </div>

                    {/* Groq Configuration */}
                    {settings.provider === 'groq' && (
                        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700 space-y-6 animate-in fade-in slide-in-from-top-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                    <Key size={16} /> Groq API Key
                                </label>
                                <input 
                                    type="password"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="gsk_..."
                                    value={settings.groqApiKey || ''}
                                    onChange={e => setSettings({...settings, groqApiKey: e.target.value})}
                                />
                                <p className="text-xs text-slate-500 mt-1">Key is stored locally in your browser.</p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                    <Cpu size={16} /> Model ID
                                </label>
                                <input 
                                    type="text"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="llama3-70b-8192"
                                    value={settings.groqModel}
                                    onChange={e => setSettings({...settings, groqModel: e.target.value})}
                                />
                            </div>
                        </div>
                    )}

                    {/* Disclaimer */}
                    <div className="bg-amber-900/20 border border-amber-900/50 rounded-lg p-4 flex gap-3 text-amber-200/80 text-sm">
                        <AlertTriangle className="flex-shrink-0 mt-0.5" size={18} />
                        <div>
                            <strong>Pipeline Note:</strong> The "Collection Pipeline" requires Google Search Grounding capabilities and will always use the default Gemini integration, regardless of the provider selected above. This setting applies to the Chat Assistant and Summarization features.
                        </div>
                    </div>

                    {/* Save Action */}
                    <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-700">
                         {message && <span className="text-green-400 text-sm font-medium animate-pulse">{message}</span>}
                         <button 
                            onClick={handleSave}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition"
                         >
                            <Save size={18} /> Save Settings
                         </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
