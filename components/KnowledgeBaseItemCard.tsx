
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { KnowledgeItem } from '../types';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { Spinner } from './Spinner';

interface KnowledgeBaseItemCardProps {
  item: KnowledgeItem;
  onEdit: () => void;
  onDelete: () => void;
  onGenerateSummary: () => void;
  isSummarizing: boolean;
}

export const KnowledgeBaseItemCard: React.FC<KnowledgeBaseItemCardProps> = ({
  item,
  onEdit,
  onDelete,
  onGenerateSummary,
  isSummarizing,
}) => {
  return (
    <div className="bg-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col h-full transition-all duration-300 hover:shadow-purple-500/30 hover:scale-[1.02]">
      <div className="p-6 flex-grow flex flex-col"> {/* Made this a flex-col to manage content growth */}
        <div className="flex justify-between items-start mb-3">
          <h3 
            className="text-xl font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer" 
            onClick={onEdit}
            aria-label={`Edit ${item.title}`}
          >
            {item.title}
          </h3>
          {item.category && (
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium bg-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap">
              {item.category}
            </span>
          )}
        </div>

        {/* This div will contain the scrollable content */}
        <div className="flex-grow overflow-y-auto max-h-80 prose prose-sm prose-invert max-w-none text-slate-300 mb-4 leading-relaxed pr-2"> {/* Added pr-2 for scrollbar spacing */}
          {item.summary && (
            <div className="mb-4 p-3 bg-slate-700/60 rounded-md border border-slate-600/50">
              <h4 className="font-semibold text-indigo-300 !mt-0 !mb-2">AI Summary:</h4>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.summary}</ReactMarkdown>
            </div>
          )}
          
          <div className={item.summary ? "mt-3" : ""}>
             {item.summary && <h4 className="font-semibold text-slate-200 !mt-0 !mb-2">Full Content:</h4>}
             <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.content}</ReactMarkdown>
          </div>
        </div>
        
        {item.tags && item.tags.length > 0 && (
          <div className="mt-auto pt-2"> {/* Ensure tags are pushed towards the bottom before actions if content is short */}
            {item.tags.map(tag => (
              <span key={tag} className="inline-block bg-purple-600 bg-opacity-80 text-purple-100 text-xs font-semibold mr-2 mb-2 px-2.5 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="p-4 bg-slate-800/50 border-t border-slate-700/50 flex justify-end items-center space-x-2 mt-auto"> {/* mt-auto for footer */}
        <button
          onClick={onGenerateSummary}
          disabled={isSummarizing || !item.content} // Disable if no content to summarize
          title={item.content ? "Generate AI Summary" : "Content needed to generate summary"}
          aria-label="Generate AI Summary"
          className="p-2 text-slate-400 hover:text-indigo-400 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
        >
          {isSummarizing ? <Spinner size="sm" /> : <SparklesIcon className="w-5 h-5" />}
        </button>
        <button 
          onClick={onEdit} 
          title="Edit Item"
          aria-label="Edit Item"
          className="p-2 text-slate-400 hover:text-green-400 transition-colors"
        >
          <EditIcon className="w-5 h-5" />
        </button>
        <button 
          onClick={onDelete} 
          title="Delete Item"
          aria-label="Delete Item"
          className="p-2 text-slate-400 hover:text-red-400 transition-colors"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
