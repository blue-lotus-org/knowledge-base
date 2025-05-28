
import React, { useState, useEffect, FormEvent } from 'react';
import { KnowledgeItem, KnowledgeItemCreate } from '../types';
import { Modal } from './Modal';

interface KnowledgeBaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: KnowledgeItemCreate, id?: string) => void;
  initialData?: KnowledgeItem | null;
}

export const KnowledgeBaseFormModal: React.FC<KnowledgeBaseFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState(''); // Comma-separated string

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content);
      setCategory(initialData.category);
      setTags(initialData.tags.join(', '));
    } else {
      setTitle('');
      setContent('');
      setCategory('');
      setTags('');
    }
  }, [initialData, isOpen]); // Re-populate form when modal opens with new initialData

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
        alert("Title and Content are required."); // Simple validation
        return;
    }
    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    onSubmit({ title, content, category, tags: tagsArray }, initialData?.id);
    onClose(); // Close modal after submit
  };
  
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Knowledge Item' : 'Create New Knowledge Item'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-md bg-slate-700 text-slate-200 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder-slate-400"
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-slate-300 mb-1">Content</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={8}
            className="w-full px-3 py-2 rounded-md bg-slate-700 text-slate-200 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder-slate-400"
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-1">Category</label>
          <input
            type="text"
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-slate-700 text-slate-200 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder-slate-400"
          />
        </div>
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-slate-300 mb-1">Tags (comma-separated)</label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-slate-700 text-slate-200 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder-slate-400"
          />
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {initialData ? 'Save Changes' : 'Create Item'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
    