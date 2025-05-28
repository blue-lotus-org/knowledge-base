import { KnowledgeItem, FullyParsedImportedItem, KnowledgeItemCreate } from '../types';
import matter from 'gray-matter';
import JSZip from 'jszip';

// Helper to sanitize filenames (can be removed if not used for JSON export directly for filename)
// const sanitizeFilename = (name: string): string => {
//   return name.replace(/[^a-z0-9_.-]/gi, '_').substring(0, 100);
// };

export const exportData = async (data: KnowledgeItem[], jsonFileName: string): Promise<void> => {
  try {
    const jsonData = JSON.stringify(data, null, 2); // Pretty print JSON
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = jsonFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting data as JSON:", error);
    throw new Error("Failed to export data as JSON.");
  }
};

const parseMarkdownFile = (fileContent: string, fileName: string): FullyParsedImportedItem => {
  try {
    const { data: frontmatterData, content } = matter(fileContent);
    
    // Validate that frontmatterData is an object
    if (typeof frontmatterData !== 'object' || frontmatterData === null) {
        throw new Error(`Invalid frontmatter structure in ${fileName}: not an object.`);
    }

    if (!frontmatterData.title || typeof frontmatterData.title !== 'string') {
      throw new Error(`Title missing or invalid in frontmatter of ${fileName}`);
    }

    const itemData: FullyParsedImportedItem = {
      title: frontmatterData.title,
      content: content.trim(),
      category: typeof frontmatterData.category === 'string' ? frontmatterData.category : 'Uncategorized',
      tags: Array.isArray(frontmatterData.tags) ? frontmatterData.tags.map(String).filter(tag => tag.trim() !== '') : [],
      summary: typeof frontmatterData.summary === 'string' ? frontmatterData.summary : undefined,
    };

    if (frontmatterData.createdAt && (typeof frontmatterData.createdAt === 'string' || frontmatterData.createdAt instanceof Date) && !isNaN(new Date(frontmatterData.createdAt as string | Date).getTime())) {
        itemData.createdAt = new Date(frontmatterData.createdAt as string | Date).toISOString();
    }
    if (frontmatterData.updatedAt && (typeof frontmatterData.updatedAt === 'string' || frontmatterData.updatedAt instanceof Date) && !isNaN(new Date(frontmatterData.updatedAt as string | Date).getTime())) {
        itemData.updatedAt = new Date(frontmatterData.updatedAt as string | Date).toISOString();
    }
    // ID is not typically in frontmatter, will be generated if not present from other import sources

    return itemData;
  } catch (e) {
    console.error(`Error parsing Markdown file ${fileName}:`, e);
    throw new Error(`Failed to parse Markdown file ${fileName}: ${(e as Error).message}`);
  }
};

export const importData = async (file: File): Promise<Array<FullyParsedImportedItem>> => {
  return new Promise(async (resolve, reject) => {
    if (!file) {
      return reject(new Error("No file selected."));
    }

    const importedItems: Array<FullyParsedImportedItem> = [];
    const fileName = file.name.toLowerCase();

    if (file.type === 'application/json' || fileName.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          if (content === null || content === undefined) throw new Error("JSON file content is empty or could not be read.");
          
          const parsedJson = JSON.parse(content);
          if (!Array.isArray(parsedJson)) {
            throw new Error("JSON file content is not a valid array of knowledge items.");
          }

          parsedJson.forEach((item: any, index: number) => {
            if (typeof item !== 'object' || item === null) {
                console.warn(`Skipping invalid item at index ${index} in JSON file: not an object.`);
                return;
            }
            if (typeof item.title !== 'string' || typeof item.content !== 'string') {
                console.warn(`Skipping item at index ${index} in JSON file: missing required 'title' or 'content'.`);
                return;
            }
            
            const fullyParsedItem: FullyParsedImportedItem = {
              id: typeof item.id === 'string' ? item.id : undefined,
              title: item.title,
              content: item.content,
              category: typeof item.category === 'string' ? item.category : 'Uncategorized',
              tags: Array.isArray(item.tags) ? item.tags.map(String).filter(tag => tag.trim() !== '') : [],
              summary: typeof item.summary === 'string' ? item.summary : undefined,
              createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
              updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
            };
            importedItems.push(fullyParsedItem);
          });
          
          if (importedItems.length === 0 && parsedJson.length > 0) {
            reject(new Error("JSON file contained items, but none were valid knowledge items. Check console for details."));
            return;
          } else if (importedItems.length === 0) {
             reject(new Error("No valid knowledge items found in the JSON file."));
             return;
          }
          resolve(importedItems);
        } catch (e) {
          console.error("Error parsing JSON file:", e);
          reject(new Error(`Failed to parse JSON file: ${(e as Error).message}`));
        }
      };
      reader.onerror = (error) => {
        console.error("Error reading JSON file:", error);
        reject(new Error("Failed to read JSON file."));
      };
      reader.readAsText(file);
      return; // Exit promise flow here for JSON

    } else if (file.type === 'application/zip' || fileName.endsWith('.zip')) {
      try {
        const zip = await JSZip.loadAsync(file);
        const markdownFilePromises: Promise<void>[] = [];

        zip.forEach((relativePath, zipEntry) => {
          if (zipEntry.name.endsWith('.md') && !zipEntry.dir) {
            markdownFilePromises.push(
              zipEntry.async('string').then(content => {
                try {
                    importedItems.push(parseMarkdownFile(content, zipEntry.name));
                } catch(parseError) {
                    console.warn(`Skipping file ${zipEntry.name} due to parsing error:`, (parseError as Error).message);
                }
              }).catch(err => { // Catch errors from zipEntry.async itself
                console.warn(`Skipping file ${zipEntry.name} due to error reading content:`, (err as Error).message);
              })
            );
          }
        });
        await Promise.all(markdownFilePromises);
        
        if (importedItems.length === 0 && markdownFilePromises.length > 0) {
          reject(new Error("ZIP contained Markdown files, but none could be parsed successfully. Check console for details."));
          return;
        } else if (importedItems.length === 0) {
          reject(new Error("No valid Markdown files found in the ZIP archive."));
          return;
        }
      } catch (e) {
        console.error("Error processing ZIP file:", e);
        return reject(new Error(`Failed to process ZIP file: ${(e as Error).message}`));
      }
    } else if (file.type === 'text/markdown' || fileName.endsWith('.md') || (file.type === 'application/octet-stream' && fileName.endsWith('.md'))) { 
      try {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const content = event.target?.result as string;
            if (content === null || content === undefined) throw new Error("File content is empty or could not be read.");
            importedItems.push(parseMarkdownFile(content, file.name));
            resolve(importedItems);
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = (error) => {
          console.error("Error reading MD file:", error);
          reject(new Error("Failed to read MD file."));
        };
        reader.readAsText(file);
        return; 
      } catch (e) {
         return reject(e);
      }
    } else {
      return reject(new Error(`Invalid file type: ${file.type || 'unknown'}. Please select a JSON (.json), Markdown (.md), or ZIP (.zip) file.`));
    }
    resolve(importedItems);
  });
};