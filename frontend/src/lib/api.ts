// frontend/src/lib/api.ts
// Centralized API client with error handling

import { useAuth } from '@clerk/nextjs';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Parse JSON response
    let data;
    try {
      data = await response.json();
    } catch {
      // Response is not JSON
      data = null;
    }

    // Handle errors
    if (!response.ok) {
      throw new APIError(
        data?.error || data?.message || 'Request failed',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    // Network error or other
    throw new APIError(
      'Network error. Please check your connection.',
      0
    );
  }
}

// Create a custom hook for authenticated API calls
// Need to be updated properly. I think its done.
export function useAuthenticatedAPI() {
  const { getToken } = useAuth();

  const fetchWithAuth = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const token = await getToken();

    if (!token) {
      throw new APIError('No authentication token', 401);
    }

    return fetchAPI<T>(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  };

  return {
    portfolio: {
      getAll: () => fetchWithAuth('/portfolio'),
      
      getById: (id: number) => fetchWithAuth(`/portfolio/${id}`),
      
      create: (data: { name: string; description?: string }) =>
        fetchWithAuth('/portfolio', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      
      addStock: (portfolioId: number, data: any) =>
        fetchWithAuth(`/portfolio/${portfolioId}/stocks`, {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      
      removeStock: (portfolioId: number, stockId: number) =>
        fetchWithAuth(`/portfolio/${portfolioId}/stocks/${stockId}`, {
          method: 'DELETE',
        }),
      
      delete: (id: number) =>
        fetchWithAuth(`/portfolio/${id}`, { method: 'DELETE' }),
    },
    
    watchlist: {
      getAll: () => fetchWithAuth('/watchlist'),
      
      create: (data: { name: string }) =>
        fetchWithAuth('/watchlist', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      
      addStock: (watchlistId: number, symbol: string) =>
        fetchWithAuth(`/watchlist/${watchlistId}/stocks`, {
          method: 'POST',
          body: JSON.stringify({ symbol }),
        }),
      
      removeStock: (watchlistId: number, stockId: number) =>
        fetchWithAuth(`/watchlist/${watchlistId}/stocks/${stockId}`, {
          method: 'DELETE',
        }),
      
      delete: (id: number) =>
        fetchWithAuth(`/watchlist/${id}`, { method: 'DELETE' }),
    },
  };
}
// ============================================
// STOCKS API
// ============================================
export const stocksAPI = {
  getAll: (params?: { limit?: number; exchange?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.exchange) query.set('exchange', params.exchange);
    return fetchAPI(`/stocks?${query}`);
  },

  getBySymbol: (symbol: string) => 
    fetchAPI(`/stocks/${symbol}`),

  search: (query: string) =>
    fetchAPI('/stocks/search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
};

// ============================================
// IPOS API
// ============================================
export const iposAPI = {
  getAll: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return fetchAPI(`/ipos${query}`);
  },

  getUpcoming: () => fetchAPI('/ipos/upcoming'),

  getOpen: () => fetchAPI('/ipos/open'),

  getById: (id: number) => fetchAPI(`/ipos/${id}`),

  getAdvisor: (id: number) =>
    fetchAPI(`/ipos/${id}/advisor`, { method: 'POST' }),
};

// ============================================
// PORTFOLIO API
// ============================================
// Remove the old portfolioAPI export, replace with this:

export const portfolioAPI = {
  getAll: () => fetchAPI('/portfolio'),
  
  getById: (id: number) => fetchAPI(`/portfolio/${id}`),
  
  create: (data: { name: string; description?: string }) =>
    fetchAPI('/portfolio', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  addStock: (portfolioId: number, data: {
    symbol: string;
    quantity: number;
    buyPrice: number;
    buyDate: string;
  }) =>
    fetchAPI(`/portfolio/${portfolioId}/stocks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  removeStock: (portfolioId: number, stockId: number) =>
    fetchAPI(`/portfolio/${portfolioId}/stocks/${stockId}`, {
      method: 'DELETE',
    }),
  
  delete: (id: number) =>
    fetchAPI(`/portfolio/${id}`, { method: 'DELETE' }),
};

// ============================================
// WATCHLIST API
// ============================================
export const watchlistAPI = {
  getAll: () => fetchAPI('/watchlist'),

  getById: (id: number) => fetchAPI(`/watchlist/${id}`),

  create: (data: { name: string }) =>
    fetchAPI('/watchlist', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  addStock: (watchlistId: number, symbol: string) =>
    fetchAPI(`/watchlist/${watchlistId}/stocks`, {
      method: 'POST',
      body: JSON.stringify({ symbol }),
    }),

  removeStock: (watchlistId: number, stockId: number) =>
    fetchAPI(`/watchlist/${watchlistId}/stocks/${stockId}`, {
      method: 'DELETE',
    }),

  delete: (id: number) =>
    fetchAPI(`/watchlist/${id}`, { method: 'DELETE' }),
};

export { APIError };
