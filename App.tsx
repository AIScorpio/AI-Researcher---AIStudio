import React, { useState, useEffect } from 'react';
import { MemoryRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PaperList from './components/PaperList';
import CollectionManager from './components/CollectionManager';
import ChatAssistant from './components/ChatAssistant';
import Settings from './components/Settings';
import Auth from './components/Auth';
import { storageService } from './services/storageService';
import { runDailyBatchJob } from './services/geminiService';
import { User, Paper } from './types';
import { Bell, X } from 'lucide-react';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Initialize & Run Background Job
  useEffect(() => {
    const initApp = async () => {
        const currentUser = storageService.getUser();
        setUser(currentUser);
        
        // Load initial papers
        setPapers(storageService.getPapers());
        setLoading(false);

        // Run Daily Batch Job in background
        if (currentUser) {
            const newCount = await runDailyBatchJob();
            if (newCount > 0) {
                setPapers(storageService.getPapers()); // Update state
                setNotification(`Daily Auto-Collection: Added ${newCount} new research papers to your repository.`);
            }
        }
    };

    initApp();
  }, []);

  const handleUpdatePapers = () => {
    setPapers(storageService.getPapers());
  };

  const handleLogin = (u: User) => {
    setUser(u);
    // Trigger check on login as well
    runDailyBatchJob().then(count => {
        if (count > 0) {
            setPapers(storageService.getPapers());
            setNotification(`Daily Auto-Collection: Added ${count} new research papers.`);
        }
    });
  };

  const handleLogout = () => {
    storageService.logout();
    setUser(null);
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <MemoryRouter>
      <Layout user={user} onLogout={handleLogout}>
        {/* Notification Toast */}
        {notification && (
            <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-bounce-in">
                <Bell size={20} />
                <span className="text-sm font-medium">{notification}</span>
                <button 
                    onClick={() => setNotification(null)}
                    className="ml-2 hover:text-blue-200"
                >
                    <X size={16} />
                </button>
            </div>
        )}

        <Routes>
          <Route path="/" element={<Dashboard papers={papers} />} />
          <Route path="/library" element={
            <div>
                 <h2 className="text-2xl font-bold text-white mb-6">Research Repository</h2>
                 <PaperListContainer papers={papers} onUpdate={handleUpdatePapers} />
            </div>
          } />
          <Route path="/assistant" element={
            <div className="max-w-4xl mx-auto">
               <h2 className="text-2xl font-bold text-white mb-6">Research Assistant</h2>
               <ChatAssistant papers={papers} />
            </div>
          } />
          <Route path="/collect" element={
              <div className="space-y-8">
                  <CollectionManager onComplete={handleUpdatePapers} />
                  
                  {/* Show Recent additions below pipeline */}
                  <div>
                      <h3 className="text-xl font-bold text-white mb-4">Recently Collected</h3>
                      <PaperList papers={papers.slice(0, 3)} onUpdate={handleUpdatePapers} />
                  </div>
              </div>
            } 
          />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </MemoryRouter>
  );
}

// Helper wrapper to extract URL params for the PaperList
const PaperListContainer: React.FC<{papers: Paper[], onUpdate: () => void}> = ({papers, onUpdate}) => {
    const [searchParams] = useSearchParams();
    const filter = searchParams.get('filter') || undefined;

    return <PaperList papers={papers} onUpdate={onUpdate} initialFilter={filter} />;
}

export default App;