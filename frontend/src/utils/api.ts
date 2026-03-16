const API_BASE_URL = 'http://localhost:8000/api/auth';

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    // If it's a full URL, use it directly.
    // If it starts with /api/, it's already a full relative path (e.g. from Vite proxy or direct to backend).
    // Otherwise, assume it's an auth endpoint and prepend API_BASE_URL.
    const url = endpoint.startsWith('http') 
        ? endpoint 
        : endpoint.startsWith('/api/')
            ? `http://localhost:8000${endpoint}`
            : `${API_BASE_URL}${endpoint}`;
    
    const token = localStorage.getItem('access_token');

    const headers: HeadersInit = {
        ...options.headers,
    };

    // Only set Content-Type to JSON if not sending FormData
    if (!(options.body instanceof FormData)) {
        (headers as any)['Content-Type'] = (headers as any)['Content-Type'] || 'application/json';
    }

    if (token && !(headers as any)['Authorization']) {
        (headers as any)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    const data = await response.json();
    if (!response.ok) {
        throw { status: response.status, data };
    }
    return data;
};
