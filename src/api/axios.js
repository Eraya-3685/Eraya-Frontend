import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
let baseAssetsUrl = import.meta.env.VITE_ASSETS_URL;
if (baseAssetsUrl && !baseAssetsUrl.endsWith('/')) {
  baseAssetsUrl += '/';
}
export const ASSETS_URL = baseAssetsUrl;

// Helper to safely construct full image URLs
export const getImageUrl = (path) => {
  if (!path) return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  // Remove leading slash from path to avoid double slashes since ASSETS_URL has a trailing slash
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${ASSETS_URL}${cleanPath}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
