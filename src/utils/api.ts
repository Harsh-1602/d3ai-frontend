/**
 * Utility functions for API requests
 */

import { API_V1_URL, ENDPOINTS } from '../config/api.config';

// Cache for protein drug data to avoid duplicate requests
const proteinDrugCache = new Map<string, Promise<any>>();

// Event bus for protein drug updates
const proteinDrugEventBus = new EventTarget();

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
      credentials: 'include'
    });
    
    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }
    
    // Parse the JSON response
    const data = await response.json();
    return data as T;
  } catch (error) {
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
      body: JSON.stringify({ smiles }),
    }),
  
  /**
   * Get properties of a molecule
   */
  getProperties: (smiles: string) => 
    fetchApi<any>(`molecules/properties`, {
      method: 'POST',
      body: JSON.stringify({ smiles }),
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