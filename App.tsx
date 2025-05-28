
import React, { useState, useEffect, useCallback } from 'react';
import { KnowledgeItem, ModalType, KnowledgeItemCreate, FullyParsedImportedItem } from './types';
import { useKnowledgeBase } from './hooks/useKnowledgeBase';
import { KnowledgeBaseItemCard } from './components/KnowledgeBaseItemCard';
import { KnowledgeBaseFormModal } from './components/KnowledgeBaseFormModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { Header } from './components/Header';
import { PlusIcon } from './components/icons/PlusIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { Spinner } from './components/Spinner';
import { AnswerModal } from './components/AnswerModal';
import { generateSummary as genSummaryGemini, answerQuestionBasedOnContext } from './services/geminiService';
import { exportData as exportKnowledgeData, importData as importKnowledgeData } from './services/fileService';

const App: React.FC = () => {
  const {
    items,
    addItem,
    updateItem,
    deleteItem,
    loadItems, 
    isLoading: kbLoading,
  } = useKnowledgeBase();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredItems, setFilteredItems] = useState<KnowledgeItem[]>(items);
  const [activeModal, setActiveModal] = useState<ModalType>(ModalType.NONE);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isAISummarizing, setIsAISummarizing] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<string | null>(null);

  // State for "Ask AI from all data"
  const [aiGlobalQuestion, setAiGlobalQuestion] = useState<string>('');
  const [aiGlobalAnswer, setAiGlobalAnswer] = useState<string | null>(null);
  const [isAskingGlobalAI, setIsAskingGlobalAI] = useState<boolean>(false);
  const [currentAskedGlobalQuestion, setCurrentAskedGlobalQuestion] = useState<string>('');


  useEffect(() => {
    const initializeKnowledgeBase = async () => {
      await loadItems(); 
    };
    initializeKnowledgeBase();
  }, [loadItems]); 

  useEffect(() => {
    setFilteredItems(
      items.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.summary && item.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    );
  }, [searchTerm, items]);

  const showNotification = (message: string, duration: number = 3000) => {
    setNotification(message);
    setTimeout(() => setNotification(null), duration);
  };

  const handleCreateNew = () => {
    setSelectedItem(null);
    setActiveModal(ModalType.CREATE_EDIT_ITEM);
  };

  const handleEdit = (item: KnowledgeItem) => {
    setSelectedItem(item);
    setActiveModal(ModalType.CREATE_EDIT_ITEM);
  };

  const handleDeleteRequest = (id: string) => {
    setItemToDelete(id);
    setActiveModal(ModalType.DELETE_ITEM_CONFIRMATION);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteItem(itemToDelete);
      showNotification('Item deleted successfully.');
    }
    setActiveModal(ModalType.NONE);
    setItemToDelete(null);
  };

  const handleGenerateSummary = useCallback(async (item: KnowledgeItem) => {
    setIsAISummarizing(prev => ({ ...prev, [item.id]: true }));
    try {
      if (!process.env.API_KEY) {
        showNotification('API Key for Gemini is not configured. Please set the API_KEY environment variable.', 5000);
        setIsAISummarizing(prev => ({ ...prev, [item.id]: false }));
        return;
      }
      const summary = await genSummaryGemini(item.content);
      updateItem({ ...item, summary });
      showNotification('AI summary generated successfully.');
    } catch (error) {
      console.error('Error generating summary:', error);
      showNotification(`Failed to generate summary: ${(error as Error).message}`, 5000);
    } finally {
      setIsAISummarizing(prev => ({ ...prev, [item.id]: false }));
    }
  }, [updateItem, showNotification]);

  const handleExport = async () => {
    if (items.length === 0) {
      showNotification('Nothing to export. Add some items first.', 3000);
      return;
    }
    try {
      await exportKnowledgeData(items, 'knowledge_base_export.json');
      showNotification('Data exported as JSON successfully. You can use this file to update your project\'s data/knowledge_base.json.');
    } catch (error) {
      console.error('Error exporting data:', error);
      showNotification(`Failed to export data: ${(error as Error).message}`, 5000);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const importedParsedItems: FullyParsedImportedItem[] = await importKnowledgeData(file);
        
        if (importedParsedItems.length > 0) {
          await loadItems(importedParsedItems as any[]); 
          showNotification(`Successfully imported ${importedParsedItems.length} item(s) from ${file.name.endsWith('.json') ? 'JSON' : 'Markdown/ZIP'}.`);
        } else {
          showNotification('No valid items found in the imported file.', 5000);
        }
      } catch (error) {
        console.error('Error importing data:', error);
        showNotification(`Failed to import data: ${(error as Error).message}`, 5000);
      }
      if (event.target) {
        event.target.value = ''; // Reset file input
      }
    }
  };
  
  const handleAskGlobalAI = async () => {
    if (!aiGlobalQuestion.trim()) {
      showNotification('Please enter a question.', 3000);
      return;
    }
    if (!process.env.API_KEY) {
      showNotification('API Key for Gemini is not configured. Please set the API_KEY environment variable.', 5000);
      return;
    }
    if (items.length === 0) {
      showNotification('Knowledge base is empty. Add some items before asking.', 5000);
      return;
    }

    setIsAskingGlobalAI(true);
    setAiGlobalAnswer(null);
    setCurrentAskedGlobalQuestion(aiGlobalQuestion);
    setActiveModal(ModalType.ASK_AI_GLOBAL_ANSWER);

    try {
      const context = items.map(item => 
        `Item ID: ${item.id}\nTitle: ${item.title}\nCategory: ${item.category}\nTags: ${item.tags.join(', ')}\n${item.summary ? `Summary: ${item.summary}\n` : ''}Content: ${item.content}`
      ).join('\n\n---\n\n');
      
      const answer = await answerQuestionBasedOnContext(context, aiGlobalQuestion);
      setAiGlobalAnswer(answer);
    } catch (error) {
      console.error('Error asking AI based on all data:', error);
      setAiGlobalAnswer(`Failed to get answer: ${(error as Error).message}`);
    } finally {
      setIsAskingGlobalAI(false);
      // Don't reset aiGlobalQuestion here, user might want to refine it
    }
  };


  if (kbLoading && items.length === 0) { 
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex flex-col items-center justify-center p-4">
        <Spinner size="lg" />
        <p className="mt-4 text-lg">Loading Knowledge Base...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex flex-col p-4 md:p-8">
      <Header onExport={handleExport} onImport={handleImport} />

      {notification && (
        <div className="fixed top-5 right-5 bg-indigo-600 text-white py-2.5 px-5 rounded-lg shadow-xl z-[100] text-sm animate-fadeInUp">
          {notification}
        </div>
      )}

      <main className="container mx-auto mt-8 flex-grow">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <input
            type="text"
            aria-label="Search knowledge base"
            placeholder="Search knowledge base (titles, content, tags...)"
            className="w-full md:w-1/2 px-4 py-2.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder-slate-400 transition-shadow focus:shadow-lg focus:shadow-indigo-500/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={handleCreateNew}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out hover:shadow-lg hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transform hover:scale-105"
            aria-label="Add new knowledge entry"
          >
            <PlusIcon className="w-5 h-5" />
            Add New Entry
          </button>
        </div>

        {/* Ask AI from all data section */}
        <div className="mb-8 p-6 bg-slate-800/70 rounded-xl shadow-lg border border-slate-700/50">
          <h2 className="text-xl font-semibold text-indigo-300 mb-3">Ask AI from All Data</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              aria-label="Ask a question based on all knowledge base items"
              placeholder="Ask a question about anything in the knowledge base..."
              className="flex-grow px-4 py-2.5 rounded-lg bg-slate-700 text-slate-200 border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder-slate-400 transition-shadow focus:shadow-lg focus:shadow-indigo-500/30"
              value={aiGlobalQuestion}
              onChange={(e) => setAiGlobalQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isAskingGlobalAI && handleAskGlobalAI()}
            />
            <button
              onClick={handleAskGlobalAI}
              disabled={isAskingGlobalAI || items.length === 0 || !process.env.API_KEY}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out hover:shadow-lg hover:shadow-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105"
              aria-label="Submit question to AI"
            >
              {isAskingGlobalAI ? <Spinner size="sm" color="text-white" /> : <SparklesIcon className="w-5 h-5" />}
              Ask AI
            </button>
          </div>
            {items.length === 0 && <p className="text-xs text-slate-500 mt-2">Add items to the knowledge base to enable this feature.</p>}
            {!process.env.API_KEY && <p className="text-xs text-red-400 mt-2">API_KEY for Gemini is not configured. This feature is disabled.</p>}
        </div>


        {filteredItems.length === 0 && !kbLoading && (
           <div className="text-center py-12">
            <svg className="mx-auto h-16 w-16 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z" />
            </svg>
            <h3 className="mt-4 text-xl font-semibold text-slate-300">
              {searchTerm ? 'No items match your search' : 'Knowledge Base is Empty'}
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              {searchTerm ? "Try a different search term or " : "Get started by "}
              <button onClick={handleCreateNew} className="font-medium text-indigo-400 hover:text-indigo-300 focus:outline-none focus:underline">
                adding a new entry
              </button>
              { !searchTerm && " or import existing JSON, Markdown, or ZIP files."}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
          {filteredItems.map(item => (
            <KnowledgeBaseItemCard
              key={item.id}
              item={item}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDeleteRequest(item.id)}
              onGenerateSummary={() => handleGenerateSummary(item)}
              isSummarizing={isAISummarizing[item.id] || false}
            />
          ))}
        </div>
      </main>

      {activeModal === ModalType.CREATE_EDIT_ITEM && (
        <KnowledgeBaseFormModal
          isOpen={activeModal === ModalType.CREATE_EDIT_ITEM}
          onClose={() => setActiveModal(ModalType.NONE)}
          onSubmit={(data, id) => {
            if (id) {
              updateItem({ ...data, id });
              showNotification('Item updated successfully.');
            } else {
              addItem(data);
              showNotification('Item created successfully.');
            }
            setActiveModal(ModalType.NONE);
          }}
          initialData={selectedItem}
        />
      )}

      {activeModal === ModalType.DELETE_ITEM_CONFIRMATION && (
        <ConfirmationModal
          isOpen={activeModal === ModalType.DELETE_ITEM_CONFIRMATION}
          onClose={() => setActiveModal(ModalType.NONE)}
          onConfirm={confirmDelete}
          title="Delete Knowledge Item"
          message="Are you sure you want to delete this item? This action cannot be undone."
        />
      )}

      {activeModal === ModalType.ASK_AI_GLOBAL_ANSWER && (
        <AnswerModal
          isOpen={activeModal === ModalType.ASK_AI_GLOBAL_ANSWER}
          onClose={() => setActiveModal(ModalType.NONE)}
          title="AI Answer"
          question={currentAskedGlobalQuestion}
          answer={aiGlobalAnswer}
          isLoading={isAskingGlobalAI}
        />
      )}

      <footer className="text-center py-8 text-slate-500 text-sm">
        Powered by <a href="https://lotuschain.org">LOTUS</a> AI Knowledge Hub &copy; 2023-{new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default App;