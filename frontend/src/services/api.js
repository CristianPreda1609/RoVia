import axios from 'axios';

// Creăm o instanță Axios cu URL-ul de bază al backend-ului tău
const api = axios.create({
    baseURL: 'http://localhost:5144/api', // Schimbat din https în http
    headers: {
        'Content-Type': 'application/json',
    },
});

const toCamelKey = (key) => {
    if (!key || typeof key !== 'string') return key;
    return key.length ? `${key[0].toLowerCase()}${key.slice(1)}` : key;
};

const addCamelCaseAliases = (value) => {
    if (Array.isArray(value)) {
        return value.map(addCamelCaseAliases);
    }

    if (value && typeof value === 'object') {
        const result = {};
        Object.entries(value).forEach(([key, val]) => {
            const normalizedVal = addCamelCaseAliases(val);
            result[key] = normalizedVal;

            if (key[0] === key[0]?.toUpperCase()) {
                const camelKey = toCamelKey(key);
                if (!(camelKey in result)) {
                    result[camelKey] = normalizedVal;
                }
            }
        });
        return result;
    }

    return value;
};

// Interceptor: Adaugă automat token-ul la fiecare cerere, dacă există
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => {
        response.data = addCamelCaseAliases(response.data);
        return response;
    },
    (error) => Promise.reject(error)
);

export default api;