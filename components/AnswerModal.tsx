
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Modal } from './Modal';
import { Spinner } from './Spinner';

interface AnswerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  question: string;
  answer: string | null;
  isLoading: boolean;
}

export const AnswerModal: React.FC<AnswerModalProps> = ({
  isOpen,
  onClose,
  title,
  question,
  answer,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-4">
        <div>
          <h3 className="text-md font-semibold text-slate-400 mb-1">Your Question:</h3>
          <p className="text-slate-200 bg-slate-700/50 p-3 rounded-md italic">{question}</p>
        </div>
        
        <div>
          <h3 className="text-md font-semibold text-slate-400 mb-1">AI's Answer:</h3>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" />
              <p className="ml-3 text-slate-300">Generating answer...</p>
            </div>
          )}
          {!isLoading && answer && (
            <div className="prose prose-sm prose-invert max-w-none p-3 bg-slate-700/50 rounded-md max-h-[50vh] overflow-y-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
            </div>
          )}
          {!isLoading && !answer && (
             <p className="text-slate-400 p-3 bg-slate-700/50 rounded-md">No answer received or an error occurred.</p>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
