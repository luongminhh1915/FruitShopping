/**
 * FruitShopping - API Service
 * Wrapper for all backend API calls
 */

const BASE_URL = 'http://localhost:8080/api';

const API = {
  /**
   * Generic fetch with error handling
   */
  async _fetch(endpoint, options = {}) {
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.data ?? data;
    } catch (err) {
      console.error(`[API] Error fetching ${endpoint}:`, err);
      return null;
    }
  },

  // -------- Categories --------
  getCategories()          { return this._fetch('/categories'); },
  getAllCategories()        { return this._fetch('/categories/all'); },

  // -------- Products --------
  getFeaturedProducts(limit = 8)              { return this._fetch(`/products/featured?limit=${limit}`); },
  getNewProducts(limit = 8)                   { return this._fetch(`/products/new?limit=${limit}`); },
  getProductsByCategory(categoryId, limit = 8){ return this._fetch(`/products/category/${categoryId}?limit=${limit}`); },
  searchProducts(keyword, page = 0, size = 12){ return this._fetch(`/products/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`); },
};

window.API = API;
