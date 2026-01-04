import React, { useState, useMemo, useEffect } from 'react';
import { Paper, BankingDomain, AIDomain } from '../types';
import { Share2, Bookmark, BookmarkCheck, ExternalLink, Tag } from 'lucide-react';
import { storageService } from '../services/storageService';

interface PaperListProps {
  papers: Paper[];
  initialFilter?: string; // Could be a domain string
  onUpdate: () => void;
}

const PaperList: React.FC<PaperListProps> = ({ papers, initialFilter, onUpdate }) => {
  const [filter, setFilter] = useState<string>(initialFilter || 'All');
  const [search, setSearch] = useState('');
  const [newTagInput, setNewTagInput] = useState<{id: string, val: string} | null>(null);

  useEffect(() => {
    setFilter(initialFilter || 'All');
  }, [initialFilter]);

  const filteredPapers = useMemo(() => {
    return papers.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                            p.abstract.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'All' || 
                            p.bankingDomain === filter || 
                            p.aiDomain === filter;
      return matchesSearch && matchesFilter;
    });
  }, [papers, filter, search]);

  const handleToggleFav = (id: string) => {
    storageService.toggleFavorite(id);
    onUpdate();
  };

  const handleShare = (paper: Paper) => {
    const text = `Check out this research: "${paper.title}" - ${paper.url}`;
    const mailto = `mailto:?subject=Research Paper Share&body=${encodeURIComponent(text)}`;
    window.open(mailto, '_blank');
  };

  const handleAddTag = (id: string) => {
    if (newTagInput && newTagInput.id === id && newTagInput.val.trim()) {
        storageService.addTag(id, newTagInput.val.trim());
        setNewTagInput(null);
        onUpdate();
    }
  };

  // Safe Author Renderer
  const renderAuthors = (authors: any) => {
    if (Array.isArray(authors)) {
        return authors.length > 0 ? authors.join(', ') : 'Unknown Authors';
    }
    if (typeof authors === 'string') return authors;
    return 'Unknown Authors';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
        <input 
          type="text" 
          placeholder="Filter by title or abstract..." 
          className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none flex-grow"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select 
          className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="All">All Sectors</option>
          {Object.values(BankingDomain).map(d => <option key={d} value={d}>{d}</option>)}
          {Object.values(AIDomain).map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="grid gap-4">
        {filteredPapers.map(paper => (
          <div key={paper.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-grow">
                <div className="flex gap-2 mb-2 flex-wrap">
                  <span className="bg-blue-900/50 text-blue-300 text-xs px-2 py-1 rounded-full border border-blue-800">{paper.bankingDomain}</span>
                  <span className="bg-purple-900/50 text-purple-300 text-xs px-2 py-1 rounded-full border border-purple-800">{paper.aiDomain}</span>
                  <span className="bg-emerald-900/50 text-emerald-300 text-xs px-2 py-1 rounded-full border border-emerald-800">{paper.methodology}</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-100 mb-2">{paper.title}</h3>
                <p className="text-slate-400 text-sm mb-3 line-clamp-2">{paper.abstract}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                  <span className="font-medium text-slate-300">{renderAuthors(paper.authors)}</span>
                  <span>•</span>
                  <span>{paper.publicationDate}</span>
                  <span>•</span>
                  <span>{paper.source}</span>
                  <span>•</span>
                  <span className="text-amber-500">{paper.citationCount} Citations</span>
                </div>
                
                {/* Tags Section */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    {paper.tags.map((t, idx) => (
                        <span key={idx} className="flex items-center text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded">
                            <Tag size={10} className="mr-1" /> {t}
                        </span>
                    ))}
                    {newTagInput && newTagInput.id === paper.id ? (
                        <div className="flex items-center">
                            <input 
                                autoFocus
                                type="text" 
                                className="bg-slate-900 text-xs text-white border border-slate-600 rounded px-1 w-20"
                                value={newTagInput.val}
                                onChange={(e) => setNewTagInput({id: paper.id, val: e.target.value})}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTag(paper.id)}
                                onBlur={() => handleAddTag(paper.id)}
                            />
                        </div>
                    ) : (
                        <button 
                            onClick={() => setNewTagInput({id: paper.id, val: ''})}
                            className="text-xs text-blue-400 hover:text-blue-300"
                        >
                            + Tag
                        </button>
                    )}
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <button 
                  onClick={() => handleToggleFav(paper.id)}
                  className={`p-2 rounded-lg transition ${paper.isFavorite ? 'text-amber-400 bg-amber-900/20' : 'text-slate-400 hover:bg-slate-700'}`}
                  title={paper.isFavorite ? "Remove from Favorites" : "Save to Favorites"}
                >
                  {paper.isFavorite ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                </button>
                <button 
                  onClick={() => handleShare(paper)}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 transition"
                  title="Share via Email"
                >
                  <Share2 size={20} />
                </button>
                <a 
                  href={paper.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 transition flex justify-center"
                  title="Read Source"
                >
                  <ExternalLink size={20} />
                </a>
              </div>
            </div>
          </div>
        ))}

        {filteredPapers.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No papers found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default PaperList;