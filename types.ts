
export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  summary?: string;
}

export type KnowledgeItemCreate = Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt' | 'summary'> & { summary?: string };
export type KnowledgeItemUpdate = Partial<KnowledgeItemCreate> & { id: string };

// Represents an item fully parsed from an imported file, ready to be processed by useKnowledgeBase
// It includes all fields from KnowledgeItemCreate, plus potentially id, createdAt, and updatedAt as strings.
export type FullyParsedImportedItem = KnowledgeItemCreate & {
  id?: string; // Added optional id
  createdAt?: string;
  updatedAt?: string;
};

export enum ModalType {
  NONE,
  CREATE_EDIT_ITEM,
  DELETE_ITEM_CONFIRMATION,
  ASK_AI_GLOBAL_ANSWER, // Added for the new global AI answer modal
}