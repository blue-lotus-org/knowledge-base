import React from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { UploadIcon } from './icons/UploadIcon';

interface HeaderProps {
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Header: React.FC<HeaderProps> = ({ onExport, onImport }) => {
  const importInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  return (
    <header className="py-6">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-4 md:mb-0">
          LOTUS AI Knowledge Hub
        </h1>
        <div className="flex space-x-3">
          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg shadow transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
            aria-label="Import data from JSON, Markdown, or ZIP file"
          >
            <UploadIcon className="w-5 h-5" />
            Import
          </button>
          <input
            type="file"
            ref={importInputRef}
            accept=".json,application/json,.md,text/markdown,.zip,application/zip"
            onChange={onImport}
            className="hidden"
            aria-hidden="true"
          />
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg shadow transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
            aria-label="Export data as JSON file"
          >
            <DownloadIcon className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>
    </header>
  );
};