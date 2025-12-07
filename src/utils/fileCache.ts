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
 */
export async function saveFileToCache(file: UploadedFile): Promise<void> {
  try {
    // Don't cache demo files
    if (file.id.startsWith('demo-')) {
      console.warn('Cannot cache demo files');
      return;
    }

    const db = await openDatabase();
    
    // Convert File to ArrayBuffer for storage
    const arrayBuffer = await file.file.arrayBuffer();
    
    // Store file data in IndexedDB
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
    
    // Store metadata in localStorage
    const metadata: SerializableFileMetadata = {
      id: file.id,
      name: file.name,
      size: file.size,
      uploadTime: file.uploadTime.toISOString(),
      zipMetadata: file.zipMetadata,
      isPermanentlyCached: true,
    };
    
    localStorage.setItem(
      `${METADATA_KEY_PREFIX}${file.id}`,
      JSON.stringify(metadata)
    );
    
    db.close();
  } catch (error) {
    console.error('Failed to save file to cache:', error);
    throw error;
  }
}

/**
 * Remove a file from permanent cache
 */
export async function removeFileFromCache(fileId: string): Promise<void> {
  try {
    const db = await openDatabase();
    
    // Remove from IndexedDB
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(fileId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // Remove metadata from localStorage
    localStorage.removeItem(`${METADATA_KEY_PREFIX}${fileId}`);
    
    db.close();
  } catch (error) {
    console.error('Failed to remove file from cache:', error);
    throw error;
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
    
    for (const key of metadataKeys) {
      try {
        const metadataStr = localStorage.getItem(key);
        if (!metadataStr) continue;
        
        const metadata: SerializableFileMetadata = JSON.parse(metadataStr);
        
        // Retrieve file data from IndexedDB
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        
        const fileData = await new Promise<{ id: string; data: ArrayBuffer; type: string; name: string }>((resolve, reject) => {
          const request = store.get(metadata.id);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        
        if (fileData) {
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
 */
export async function clearAllCachedFiles(): Promise<void> {
  try {
    const db = await openDatabase();
    
    // Clear IndexedDB
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // Clear localStorage metadata
    const metadataKeys = Object.keys(localStorage).filter(key =>
      key.startsWith(METADATA_KEY_PREFIX)
    );
    
    metadataKeys.forEach(key => localStorage.removeItem(key));
    
    db.close();
  } catch (error) {
    console.error('Failed to clear cached files:', error);
    throw error;
  }
}
