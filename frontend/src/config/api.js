// Provide a safe API base URL for the frontend.
// In development, point to the backend running on port 5000.
// In production, use the environment variable REACT_APP_API_URL or relative path.
const isDevelopment = process.env.NODE_ENV === 'development';
export const API_URL = process.env.REACT_APP_API_URL || (isDevelopment ? 'http://localhost:5000' : '/api');
