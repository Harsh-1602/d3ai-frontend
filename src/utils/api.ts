/**
 * Utility functions for API requests
 */

import { API_V1_URL, ENDPOINTS } from '../config/api.config';

// Cache for protein drug data to avoid duplicate requests
const proteinDrugCache = new Map<string, Promise<any>>();

// Event bus for protein drug updates
const proteinDrugEventBus = new EventTarget();

export interface Molecule {
  id: string;
  smile: string;
  name: string;
  description?: string;
  is_valid: boolean;
  properties?: any;
  visualization_data?: any;
  structure_img?: string;  // Image from PubChem API
  similarity_to_parent?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Generic API request function with error handling
 */
export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    // Ensure endpoint starts with a slash if it doesn't already
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Build the full URL
    const url = `${API_V1_URL}${formattedEndpoint}`;
    
    // Set default headers if not provided
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };
    
    // Make the request with CORS mode
    console.log(`API Request: ${options.method || 'GET'} ${url}`);
    const response = await fetch(url, {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'same-origin'
    });
    
    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      const error = new Error(`API Error (${response.status}): ${errorText}`);
      // Add status property to the error for easier checking in components
      (error as any).status = response.status;
      throw error;
    }
    
    // Parse the JSON response
    const data = await response.json();
    return data as T;
  } catch (error: any) {
    // Check for common network errors and enhance the error message
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      const enhancedError = new Error(
        'Server connection error: Unable to reach the backend server. ' +
        'Please ensure the backend is running at http://localhost:8000'
      );
      enhancedError.name = 'ConnectionError';
      console.error('API Request failed:', enhancedError);
      throw enhancedError;
    }
    
    // Check for CORS errors (which don't provide detailed information)
    if (error.message && error.message.includes('been blocked by CORS')) {
      const corsError = new Error(
        'CORS Error: The request was blocked by CORS policy. ' +
        'This usually means the backend server is not running or not properly configured.'
      );
      corsError.name = 'CORSError';
      console.error('API Request failed:', corsError);
      throw corsError;
    }
    
    console.error('API Request failed:', error);
    throw error;
  }
}

/**
 * Disease API endpoints
 */
export const diseaseApi = {
  /**
   * Get disease suggestions for autocomplete
   */
  suggestDiseases: async (query: string) => {
    try {
      const response = await fetch(`${ENDPOINTS.diseases}/suggest/${query}`);
      if (!response.ok) throw new Error('Failed to fetch disease suggestions');
      return await response.json();
    } catch (error) {
      console.error('Error fetching disease suggestions:', error);
      throw error;
    }
  },
  
  /**
   * Search diseases by name or symptoms
   */
  searchDiseases: (query: string, limit = 10) =>
    fetchApi<any[]>(`diseases/search/${encodeURIComponent(query)}?limit=${limit}`),
  
  /**
   * Get disease by ID
   */
  getDisease: async (id: string) => {
    try {
      const response = await fetch(`${ENDPOINTS.diseases}/${id}`);
      if (!response.ok) throw new Error('Failed to fetch disease');
      return await response.json();
    } catch (error) {
      console.error('Error fetching disease:', error);
      throw error;
    }
  },
  
  /**
   * Get list of diseases with optional filters
   */
  getDiseases: (params: { name?: string; symptom?: string; skip?: number; limit?: number } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.name) queryParams.append('name', params.name);
    if (params.symptom) queryParams.append('symptom', params.symptom);
    if (params.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
    return fetchApi<any[]>(`diseases?${queryParams.toString()}`);
  },
};

/**
 * Protein API endpoints
 */
export const proteinApi = {
  /**
   * Get proteins by disease ID
   */
  getProteinsByDiseaseId: (diseaseId: string) => 
    fetchApi<any[]>(`proteins?disease_id=${encodeURIComponent(diseaseId)}`),
  
  /**
   * Get proteins by disease name
   * This returns proteins from ALL disease variants matching the name, not just the first one
   */
  getProteinsByDiseaseName: (diseaseName: string, skip = 0, limit = 100) => 
    fetchApi<any[]>(`proteins/disease/name/${encodeURIComponent(diseaseName)}?skip=${skip}&limit=${limit}`),
  
  /**
   * Get ChEMBL target ID for a UniProt ID
   */
  getChemblTargetId: (uniprotId: string) => 
    fetchApi<{uniprot_id: string, chembl_target_id: string}>(`proteins/uniprot/${encodeURIComponent(uniprotId)}/chembl-target`),
  
  /**
   * Get drugs for a ChEMBL target ID
   */
  getDrugsByChemblTargetId: (targetId: string, limit = 20) => 
    fetchApi<any[]>(`proteins/chembl-target/${encodeURIComponent(targetId)}/drugs?limit=${limit}`),
  
  /**
   * Get proteins for a disease
   */
  getProteinsByDisease: (diseaseName: string, skip = 0, limit = 100) =>
    fetchApi<any[]>(`proteins/disease/${encodeURIComponent(diseaseName)}?skip=${skip}&limit=${limit}`),
  
  /**
   * Get proteins for multiple diseases
   */
  getProteinsByDiseaseIds: (params: { disease_ids: string[], disease_name: string, skip?: number, limit?: number }) => {
    const queryParams = new URLSearchParams();
    params.disease_ids.forEach(id => queryParams.append('disease_ids', id));
    if (params.disease_name) queryParams.append('disease_name', params.disease_name);
    if (params.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
    return fetchApi<any[]>(`proteins/diseases?${queryParams.toString()}`);
  },
  
  /**
   * Search for diseases matching a query
   */
  searchDiseases: (query: string, limit = 20) =>
    fetchApi<any[]>(`proteins/diseases/search/${encodeURIComponent(query)}?limit=${limit}`),

  /**
   * Get drug SMILES for a disease
   */
  getDrugSmilesForDisease: (diseaseName: string, smilesOnly = false) =>
    fetchApi<any[]>(`proteins/disease/name/${encodeURIComponent(diseaseName)}/drug-smiles?smiles_only=${smilesOnly}`),

  /**
   * Subscribe to protein drug updates
   * @param callback Function to call when new drug data is available
   * @returns Cleanup function to unsubscribe
   */
  subscribeToProteinDrugUpdates: (callback: (data: any) => void) => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      callback(customEvent.detail);
    };
    proteinDrugEventBus.addEventListener('proteinDrugUpdate', handler);
    return () => proteinDrugEventBus.removeEventListener('proteinDrugUpdate', handler);
  },

  /**
   * Get drugs for a specific protein efficiently with streaming updates
   */
  getDrugsForProtein: async (protein: { id: string; name: string; uniprot_id?: string; pdb_id?: string }) => {
    const cacheKey = `protein_drugs_${protein.id}`;
    
    // Check cache first
    if (proteinDrugCache.has(cacheKey)) {
      const cachedResult = await proteinDrugCache.get(cacheKey);
      // Emit cached result through event bus
      proteinDrugEventBus.dispatchEvent(new CustomEvent('proteinDrugUpdate', { 
        detail: { ...cachedResult, fromCache: true }
      }));
      return cachedResult;
    }

    // Create a promise for this request and store it in cache
    const promise = (async () => {
      try {
        // Call the streaming endpoint with a single protein
        const response = await fetchApi<{ results: any[] }>('proteins/drugs/stream', {
          method: 'POST',
          body: JSON.stringify([{ 
            id: protein.id, 
            name: protein.name, 
            uniprot_id: protein.uniprot_id || protein.pdb_id // Use uniprot_id if available, fall back to pdb_id
          }])
        });

        const result = response.results[0] || {
          proteinId: protein.id,
          proteinName: protein.name,
          drugs: [],
          error: 'No result returned from server',
          timestamp: new Date().toISOString(),
          status: 'error'
        };

        // Emit result through event bus
        proteinDrugEventBus.dispatchEvent(new CustomEvent('proteinDrugUpdate', { 
          detail: { ...result, fromCache: false }
        }));

        return result;
      } catch (error: any) {
        const errorResult = {
          proteinId: protein.id,
          proteinName: protein.name,
          drugs: [],
          error: error.message,
          timestamp: new Date().toISOString(),
          status: 'error'
        };

        // Emit error through event bus
        proteinDrugEventBus.dispatchEvent(new CustomEvent('proteinDrugUpdate', { 
          detail: { ...errorResult, fromCache: false }
        }));

        return errorResult;
      }
    })();

    // Store in cache
    proteinDrugCache.set(cacheKey, promise);
    
    return promise;
  },

  /**
   * Get drugs for multiple proteins with streaming updates
   * This version starts fetching for all proteins immediately and emits results as they come in
   */
  getDrugsForProteins: async (proteins: Array<{ id: string; name: string; uniprot_id?: string; pdb_id?: string }>) => {
    try {
      // Map proteins to the format expected by the backend
      const proteinRequests = proteins.map(protein => ({
        id: protein.id,
        name: protein.name,
        uniprot_id: protein.uniprot_id || protein.pdb_id // Use uniprot_id if available, fall back to pdb_id
      }));

      // Call the streaming endpoint with all proteins
      const response = await fetchApi<{ results: any[] }>('proteins/drugs/stream', {
        method: 'POST',
        body: JSON.stringify(proteinRequests)
      });

      // Process and emit each result
      response.results.forEach(result => {
        const cacheKey = `protein_drugs_${result.proteinId}`;
        
        // Store in cache
        proteinDrugCache.set(cacheKey, Promise.resolve(result));
        
        // Emit through event bus
        proteinDrugEventBus.dispatchEvent(new CustomEvent('proteinDrugUpdate', { 
          detail: { ...result, fromCache: false }
        }));
      });

      return response.results;
    } catch (error: any) {
      // Handle errors for each protein
      const errorResults = proteins.map(protein => ({
        proteinId: protein.id,
        proteinName: protein.name,
        drugs: [],
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'error'
      }));

      // Emit errors through event bus
      errorResults.forEach(result => {
        const cacheKey = `protein_drugs_${result.proteinId}`;
        proteinDrugCache.set(cacheKey, Promise.resolve(result));
        proteinDrugEventBus.dispatchEvent(new CustomEvent('proteinDrugUpdate', { 
          detail: { ...result, fromCache: false }
        }));
      });

      return errorResults;
    }
  },

  /**
   * Clear the protein drug cache
   * Call this when you want to force fresh data
   */
  clearProteinDrugCache: () => {
    proteinDrugCache.clear();
  },

  /**
   * Get external references for a protein using its UniProt ID
   * Returns a dictionary mapping database names to their IDs
   */
  getProteinExternalLinks: (uniprotId: string) => 
    fetchApi<Record<string, string>>(`proteins/external-links/${encodeURIComponent(uniprotId)}`),
};

/**
 * Molecule API endpoints
 */
export const moleculeApi = {
  /**
   * Get a 2D visualization of a molecule
   */
  visualize2D: (smiles: string) => 
    fetchApi<{image: string}>(`molecules/visualize/2d`, {
      method: 'POST',
      body: JSON.stringify({ smile: smiles }),
    }),
  
  /**
   * Get a PubChem visualization of a molecule
   */
  visualizePubChem: (smiles: string) => 
    fetchApi<{image: string}>(`molecules/visualize/pubchem`, {
      method: 'POST',
      body: JSON.stringify({ smile: smiles }),
    }),
  
  /**
   * Get properties of a molecule
   */
  getProperties: (smiles: string) => 
    fetchApi<any>(`molecules/properties`, {
      method: 'POST',
      body: JSON.stringify({ smiles }),
    }),

  /**
   * Generate molecules using NVIDIA GenMol API
   */
  generateWithNvidiaGenMol: (data: {
    smiles: string;
    num_molecules?: number;
    temperature?: string;
    noise?: string;
    step_size?: number;
    scoring?: string;
    unique?: boolean;
  }) => 
    fetchApi<Molecule[]>(`molecules/generate/nvidia-genmol`, {
      method: 'POST',
      body: JSON.stringify({
        smiles: data.smiles,
        num_molecules: data.num_molecules || 30,
        temperature: data.temperature || "1",
        noise: data.noise || "1",
        step_size: data.step_size || 1,
        scoring: data.scoring || "QED",
        unique: data.unique || false
      }),
    }),
};

/**
 * API client for drug discovery endpoints
 */
export const drugDiscoveryApi = {
  // Search for drugs
  searchDrugs: async (params: { disease?: string, keyword?: string, source?: string }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.disease) queryParams.append('disease', params.disease);
      if (params.keyword) queryParams.append('keyword', params.keyword);
      if (params.source) queryParams.append('source', params.source);
      
      const response = await fetch(`${ENDPOINTS.drugDiscovery}/search?${queryParams}`);
      if (!response.ok) throw new Error('Failed to search drugs');
      return await response.json();
    } catch (error) {
      console.error('Error searching drugs:', error);
      throw error;
    }
  },
  
  // Add other drug discovery endpoints as needed
};

/**
 * Utility function to get a molecule image from any available source
 */
export const fetchMoleculeImage = async (smiles: string): Promise<string | null> => {
  // Validate input
  if (!smiles || typeof smiles !== 'string' || !smiles.trim()) {
    console.error('Invalid SMILES string provided to fetchMoleculeImage:', smiles);
    return null;
  }
  
  console.log(`fetchMoleculeImage: Attempting to fetch image for SMILES: "${smiles}"`);
  
  try {
    // Helper function to ensure proper base64 image format
    const formatBase64Image = (base64Data: string): string => {
      // If it already starts with data:image/, return as is
      if (base64Data.startsWith('data:image/')) {
        return base64Data;
      }
      // Otherwise add the prefix
      return `data:image/png;base64,${base64Data}`;
    };

    // Try PubChem first
    console.log('fetchMoleculeImage: Trying PubChem API...');
    try {
      const pubchemResult = await moleculeApi.visualizePubChem(smiles);
      if (pubchemResult?.image) {
        console.log('fetchMoleculeImage: Successfully got image from PubChem');
        return formatBase64Image(pubchemResult.image);
      }
    } catch (pubchemError) {
      console.error('fetchMoleculeImage: PubChem API error:', pubchemError);
      // Continue to next method
    }
    
    // Fall back to visualization API
    console.log('fetchMoleculeImage: Trying 2D visualization API...');
    try {
      const result = await moleculeApi.visualize2D(smiles);
      if (result?.image) {
        console.log('fetchMoleculeImage: Successfully got image from 2D visualization API');
        return formatBase64Image(result.image);
      }
    } catch (visualizeError) {
      console.error('fetchMoleculeImage: 2D visualization API error:', visualizeError);
      // Continue to next method
    }
    
    // If all else fails, use direct PubChem URL (may not work due to CORS)
    console.log('fetchMoleculeImage: Using direct PubChem URL as fallback');
    return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(smiles)}/PNG`;
  } catch (error) {
    console.error('fetchMoleculeImage: Unhandled error:', error);
    return null;
  }
}; 