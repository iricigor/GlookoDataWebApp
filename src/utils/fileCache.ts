/**
 * File caching utilities for permanent browser storage
 * Uses IndexedDB for file storage and localStorage for metadata
 */

import type { UploadedFile, ZipMetadata } from '../types';

const DB_NAME = 'GlookoDataCache';
const DB_VERSION = 1;
const STORE_NAME = 'files';
const METADATA_KEY_PREFIX = 'cached_file_';

/**
 * Serializable file metadata for storage
 */
interface SerializableFileMetadata {
  id: string;
  name: string;
  size: number;
  uploadTime: string; // ISO string
  zipMetadata?: ZipMetadata;
  isPermanentlyCached: boolean;
}

/**
 * Open IndexedDB database
 */
async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Save a file to permanent cache (IndexedDB + localStorage)
 * @param {UploadedFile} file - The file to cache
 * @returns {Promise<void>}
 * @throws {Error} If the file cannot be saved to IndexedDB or localStorage
 */
export async function saveFileToCache(file: UploadedFile): Promise<void> {
  let db: IDBDatabase | null = null;
  
  try {
    // Don't cache demo files
    if (file.id.startsWith('demo-')) {
      console.warn('Cannot cache demo files');
      return;
    }

    db = await openDatabase();
    
    // Convert File to ArrayBuffer for storage
    const arrayBuffer = await file.file.arrayBuffer();
    
    // Store file data in IndexedDB first
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put({
        id: file.id,
        data: arrayBuffer,
        type: file.file.type,
        name: file.name,
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // Only store metadata after successful IndexedDB storage
    const metadata: SerializableFileMetadata = {
      id: file.id,
      name: file.name,
      size: file.size,
      uploadTime: file.uploadTime.toISOString(),
      zipMetadata: file.zipMetadata,
      isPermanentlyCached: true,
    };
    
    try {
      localStorage.setItem(
        `${METADATA_KEY_PREFIX}${file.id}`,
        JSON.stringify(metadata)
      );
    } catch (localStorageError) {
      console.error('Failed to save metadata to localStorage:', localStorageError);
      
      // Roll back IndexedDB write to maintain consistency
      const rollbackTransaction = db.transaction([STORE_NAME], 'readwrite');
      const rollbackStore = rollbackTransaction.objectStore(STORE_NAME);
      
      await new Promise<void>((resolve, reject) => {
        const deleteRequest = rollbackStore.delete(file.id);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });
      
      // Attempt to clean up any partial localStorage entry
      try {
        localStorage.removeItem(`${METADATA_KEY_PREFIX}${file.id}`);
      } catch {
        // Ignore cleanup errors
      }
      
      throw localStorageError;
    }
  } catch (error) {
    console.error('Failed to save file to cache:', error);
    throw error;
  } finally {
    // Always close the database connection
    if (db) {
      db.close();
    }
  }
}

/**
 * Remove a file from permanent cache
 * @param {string} fileId - The ID of the file to remove
 * @returns {Promise<void>}
 * @throws {Error} If the file cannot be removed from IndexedDB or localStorage
 */
export async function removeFileFromCache(fileId: string): Promise<void> {
  let db: IDBDatabase | null = null;
  
  try {
    db = await openDatabase();
    
    // Remove from IndexedDB with transaction completion guarantee
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(fileId);
      
      // Handle request-level errors
      request.onerror = () => reject(request.error);
      
      // Handle transaction-level errors and completion
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
      transaction.oncomplete = () => resolve();
    });
    
    // Remove metadata from localStorage
    localStorage.removeItem(`${METADATA_KEY_PREFIX}${fileId}`);
  } catch (error) {
    console.error('Failed to remove file from cache:', error);
    throw error;
  } finally {
    // Always close the database connection
    if (db) {
      db.close();
    }
  }
}

/**
 * Load all cached files from permanent storage
 */
export async function loadCachedFiles(): Promise<UploadedFile[]> {
  try {
    const db = await openDatabase();
    const cachedFiles: UploadedFile[] = [];
    
    // Get all metadata from localStorage
    const metadataKeys = Object.keys(localStorage).filter(key =>
      key.startsWith(METADATA_KEY_PREFIX)
    );
    
    // Use a single transaction for all reads
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    for (const key of metadataKeys) {
      try {
        const metadataStr = localStorage.getItem(key);
        if (!metadataStr) continue;
        
        // Safe JSON parsing with error handling
        let metadata: SerializableFileMetadata;
        try {
          metadata = JSON.parse(metadataStr);
        } catch (parseError) {
          console.error('Failed to parse metadata JSON:', parseError);
          // Clean up corrupted metadata
          localStorage.removeItem(key);
          continue;
        }
        
        // Retrieve file data from IndexedDB
        const fileData = await new Promise<{ id: string; data: ArrayBuffer; type: string; name: string } | undefined>((resolve, reject) => {
          const request = store.get(metadata.id);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        
        if (fileData && fileData.data) {
          // Reconstruct File object from stored data
          const blob = new Blob([fileData.data], { type: fileData.type });
          const file = new File([blob], fileData.name, { type: fileData.type });
          
          cachedFiles.push({
            id: metadata.id,
            name: metadata.name,
            size: metadata.size,
            uploadTime: new Date(metadata.uploadTime),
            file: file,
            zipMetadata: metadata.zipMetadata,
            isPermanentlyCached: true,
          });
        } else {
          // Clean up orphaned metadata (file data missing from IndexedDB)
          console.warn(`Orphaned metadata found for file ${metadata.id}, cleaning up`);
          localStorage.removeItem(key);
        }
      } catch (error) {
        console.error('Failed to load cached file:', error);
        // Continue with other files
      }
    }
    
    db.close();
    return cachedFiles;
  } catch (error) {
    console.error('Failed to load cached files:', error);
    return [];
  }
}

/**
 * Check if a file is cached
 */
export function isFileCached(fileId: string): boolean {
  return localStorage.getItem(`${METADATA_KEY_PREFIX}${fileId}`) !== null;
}

/**
 * Clear all cached files
 * @returns {Promise<void>}
 * @throws {Error} If files cannot be cleared from IndexedDB or localStorage
 */
export async function clearAllCachedFiles(): Promise<void> {
  let db: IDBDatabase | null = null;
  
  try {
    db = await openDatabase();
    
    // Clear IndexedDB with transaction completion guarantee
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      
      // Handle request-level errors
      request.onerror = () => reject(request.error);
      
      // Handle transaction-level errors and completion
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
      transaction.oncomplete = () => resolve();
    });
    
    // Clear localStorage metadata
    const metadataKeys = Object.keys(localStorage).filter(key =>
      key.startsWith(METADATA_KEY_PREFIX)
    );
    
    for (const key of metadataKeys) {
      try {
        localStorage.removeItem(key);
      } catch (err) {
        console.error(`Failed to remove localStorage key ${key}:`, err);
        // Continue removing other keys
      }
    }
  } catch (error) {
    console.error('Failed to clear cached files:', error);
    throw error;
  } finally {
    // Always close the database connection
    if (db) {
      db.close();
    }
  }
}
