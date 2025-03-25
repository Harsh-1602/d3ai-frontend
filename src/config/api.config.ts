/**
 * API configuration for different environments
 */

// Base URL for API requests
const getApiBaseUrl = (): string => {
  // For production deployment on Vercel
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // For development environment
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8000';
  }
  
  // Default production URL (your Vercel-deployed backend)
  return 'https://d3ai-backend.vercel.app';
};

export const API_BASE_URL = getApiBaseUrl();
export const API_V1_URL = `${API_BASE_URL}/api/v1`;

// API endpoints
export const ENDPOINTS = {
  diseases: `${API_V1_URL}/diseases`,
  drugDiscovery: `${API_V1_URL}/drug-discovery`,
  molecules: `${API_V1_URL}/molecules`,
  properties: `${API_V1_URL}/properties`,
  docking: `${API_V1_URL}/docking`,
  proteins: `${API_V1_URL}/proteins`,
}; 