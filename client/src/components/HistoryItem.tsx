
import React from 'react';
import { ProcessedLink } from '../types';
import { ExternalLink, Copy, Check, Trash2, Tag } from 'lucide-react';

interface HistoryItemProps {
  link: ProcessedLink;
  onDelete: (id: string) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ link, onDelete }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    const smartUrl = `${window.location.origin}/#/${link.smartAlias}`;
    navigator.clipboard.writeText(smartUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass p-5 rounded-2xl flex flex-col gap-4 group transition-all hover:bg-white/[0.05]">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
              {link.category}
            </span>
            <span className="text-xs text-zinc-500">
              {new Date(link.createdAt).toLocaleDateString('vi-VN')}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
            {link.title}
          </h3>
          <p className="text-sm text-zinc-400 line-clamp-2 mt-1 italic">
            "{link.description}"
          </p>
        </div>
        <button 
          onClick={() => onDelete(link.id)}
          className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
          title="Xóa"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {link.tags.map((tag) => (
          <span key={tag} className="flex items-center gap-1 text-[10px] bg-zinc-800 text-zinc-300 px-2 py-1 rounded-md">
            <Tag size={10} />
            {tag}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-3 mt-2">
        <div className="flex items-center gap-2 bg-black/40 p-3 rounded-xl border border-white/5">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Nguồn Gốc</p>
            <p className="text-sm text-blue-300 truncate font-mono">{link.originalUrl}</p>
          </div>
          <a 
            href={link.originalUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ExternalLink size={16} />
          </a>
        </div>

        <div className="flex items-center gap-2 bg-blue-500/5 p-3 rounded-xl border border-blue-500/20">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-blue-400 uppercase font-bold tracking-tighter">Liên Kết AI Chuyển Hóa</p>
            <p className="text-sm text-white truncate font-mono">alchemist.io/{link.smartAlias}</p>
          </div>
          <button 
            onClick={handleCopy}
            className="p-2 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-all flex items-center gap-2"
          >
            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-blue-400" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryItem;
