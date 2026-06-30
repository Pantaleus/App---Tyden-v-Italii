import * as SecureStore from 'expo-secure-store';

let API_URL = '';
let API_TOKEN = '';

// Initialize URL and Token from Secure Storage
export async function initApi() {
    try {
        const url = await SecureStore.getItemAsync('api_url');
        const token = await SecureStore.getItemAsync('api_token');
        if (url) API_URL = url;
        if (token) API_TOKEN = token;
    } catch (e) {
        console.error('Error loading API credentials', e);
    }
}

export function getBaseUrl() {
    return API_URL;
}

export function getApiToken() {
    return API_TOKEN;
}

export async function setCredentials(url, token) {
    API_URL = url.replace(/\/$/, ''); // Strip trailing slash
    API_TOKEN = token;
    
    await SecureStore.setItemAsync('api_url', API_URL);
    await SecureStore.setItemAsync('api_token', API_TOKEN);
}

export async function clearCredentials() {
    API_URL = '';
    API_TOKEN = '';
    await SecureStore.deleteItemAsync('api_url');
    await SecureStore.deleteItemAsync('api_token');
}

/**
 * Perform GET request
 */
export async function apiGet(endpoint) {
    if (!API_URL) throw new Error('API Base URL not configured');
    
    const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_TOKEN}`
        }
    });

    if (response.status === 401) {
        throw new Error('Unauthorized');
    }

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'API Request failed');
    }
    return data;
}

/**
 * Perform POST request
 */
export async function apiPost(endpoint, body = {}) {
    if (!API_URL) throw new Error('API Base URL not configured');

    const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_TOKEN}`
        },
        body: JSON.stringify(body)
    });

    if (response.status === 401) {
        throw new Error('Unauthorized');
    }

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'API Request failed');
    }
    return data;
}

/**
 * Perform Media Upload using multipart/form-data
 */
export async function apiUpload(fileUri, fileType, fileName) {
    if (!API_URL) throw new Error('API Base URL not configured');

    const formData = new FormData();
    formData.append('file', {
        uri: fileUri,
        type: fileType,
        name: fileName
    });

    const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${API_TOKEN}`
        },
        body: formData
    });

    if (response.status === 401) {
        throw new Error('Unauthorized');
    }

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
    }
    return data;
}
