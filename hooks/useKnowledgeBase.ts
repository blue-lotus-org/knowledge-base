
import { useState, useCallback } from 'react';
import { KnowledgeItem, KnowledgeItemCreate, KnowledgeItemUpdate } from '../types';
import { LOCAL_STORAGE_KEY } from '../constants';

export const useKnowledgeBase = () => {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const saveItemsToStorageAndState = useCallback((updatedItems: KnowledgeItem[]) => {
    try {
      // Filter out any potential undefined/null items before saving, though types should prevent this.
      const validItems = updatedItems.filter(item => item != null);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(validItems));
      setItems(validItems);
    } catch (error) {
      console.error("Failed to save items to local storage:", error);
    }
  }, []);
  
  const loadItems = useCallback(async (newItemsToImport?: Array<KnowledgeItemCreate | KnowledgeItem>) => {
    setIsLoading(true);
    try {
      if (newItemsToImport) {
        // Priority 1: Data came from explicit user import
        const fullNewItems: KnowledgeItem[] = newItemsToImport.map(item => ({
          id: (item as KnowledgeItem).id || crypto.randomUUID(),
          title: item.title,
          content: item.content,
          category: item.category || 'Uncategorized',
          tags: item.tags || [],
          createdAt: (item as KnowledgeItem).createdAt || new Date().toISOString(),
          updatedAt: (item as KnowledgeItem).updatedAt || new Date().toISOString(),
          summary: item.summary || undefined,
        }));
        saveItemsToStorageAndState(fullNewItems);
      } else {
        // Priority 2: Try loading from localStorage
        let dataToSet: KnowledgeItem[] | null = null;
        let localStorageWasEmptyOrInvalid = true;

        const storedItems = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedItems) {
          try {
            const parsedItems = JSON.parse(storedItems);
            if (Array.isArray(parsedItems) && parsedItems.every(item => typeof item === 'object' && item !== null && 'id' in item)) {
              dataToSet = parsedItems;
              localStorageWasEmptyOrInvalid = false;
            } else {
              console.warn("Corrupted or invalid data structure in localStorage. Clearing it.");
              localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear corrupted data
            }
          } catch (e) {
            console.warn("Failed to parse localStorage data. Clearing it.", e);
            localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear unparsable data
          }
        }

        // Priority 3: If localStorage was empty or invalid, try fetching from /data/knowledge_base.json
        if (localStorageWasEmptyOrInvalid) {
          try {
            const response = await fetch('/data/knowledge_base.json');
            if (response.ok) {
              const jsonData = await response.json();
              // Ensure jsonData is an array and has items, or is an empty array (valid initial state)
              if (Array.isArray(jsonData) && jsonData.every(item => typeof item === 'object' && item !== null && 'id' in item)) {
                dataToSet = jsonData;
                // If data was loaded from JSON and localStorage was indeed empty/invalid, populate localStorage
                 saveItemsToStorageAndState(jsonData); // This also sets items state
                 localStorageWasEmptyOrInvalid = false; // Mark as populated
              } else if (Array.isArray(jsonData) && jsonData.length === 0) {
                dataToSet = []; // JSON file is explicitly an empty list
                saveItemsToStorageAndState([]);
                localStorageWasEmptyOrInvalid = false; // Mark as populated (with empty)
              }
               else {
                console.warn("/data/knowledge_base.json is not a valid array of knowledge items or is structured incorrectly.");
                dataToSet = []; // Fallback to empty if JSON is invalid
              }
            } else if (response.status === 404) {
              console.log("/data/knowledge_base.json not found. Starting with an empty knowledge base.");
              dataToSet = []; // File not found, start empty
            } else {
              console.warn(`Failed to fetch /data/knowledge_base.json: ${response.status}. Starting with an empty knowledge base.`);
              dataToSet = []; // Other fetch error, start empty
            }
          } catch (error) {
            console.warn("Error fetching or parsing /data/knowledge_base.json. Starting with an empty knowledge base.", error);
            dataToSet = []; // Catch all for fetch/parse errors
          }
        }
        
        // Set state from localStorage or fetched JSON, or it remains empty if dataToSet is []
        if (dataToSet !== null) { // dataToSet will be an array (possibly empty) or null if only localStorage was attempted and failed without trying json fetch
          setItems(dataToSet);
        } else if (localStorageWasEmptyOrInvalid) { 
          // This case should ideally not be reached if the above logic correctly sets dataToSet to [] on failures.
          // But as a safeguard, ensure items is an empty array if all sources fail.
          setItems([]);
        }
      }
    } catch (error) {
      console.error("Critical error during item loading process. Starting with an empty knowledge base.", error);
      setItems([]); // Fallback to empty on any critical error
      localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear potentially problematic storage
    } finally {
      setIsLoading(false);
    }
  }, [saveItemsToStorageAndState]);
  

  const addItem = useCallback((itemData: KnowledgeItemCreate) => {
    const newItem: KnowledgeItem = {
      ...itemData,
      id: crypto.randomUUID(),
      createdAt: (itemData as any).createdAt || new Date().toISOString(),
      updatedAt: (itemData as any).updatedAt || new Date().toISOString(),
      summary: itemData.summary || undefined,
      category: itemData.category || 'Uncategorized', // Ensure category has a default
      tags: itemData.tags || [], // Ensure tags is an array
    };
    saveItemsToStorageAndState([...items, newItem]);
  }, [items, saveItemsToStorageAndState]);

  const updateItem = useCallback((updatedItemData: KnowledgeItemUpdate) => {
    const newItems = items.map(item => 
      item.id === updatedItemData.id 
        ? { ...item, ...updatedItemData, updatedAt: new Date().toISOString() } 
        : item
    );
    saveItemsToStorageAndState(newItems);
  }, [items, saveItemsToStorageAndState]);

  const deleteItem = useCallback((id: string) => {
    const newItems = items.filter(item => item.id !== id);
    saveItemsToStorageAndState(newItems);
  }, [items, saveItemsToStorageAndState]);

  return { items, addItem, updateItem, deleteItem, loadItems, isLoading };
};
