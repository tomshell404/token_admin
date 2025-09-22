import axios from 'axios';

// Base URL of your backend API
const API_BASE_URL = 'http://localhost/token-trade-clone/backend';

// Types
export interface User {
  id: number;
  email: string;
  full_name: string;
  balance: number;
  phone?: string;
  country?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  phone?: string;
  country?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  session_token: string;
}

class AuthService {
  private sessionToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.sessionToken = localStorage.getItem('session_token');
    }
  }

  // Centralized error handler
  private handleAxiosError(error: unknown, fallbackMessage: string): never {
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data) {
        throw new Error(JSON.stringify(error.response.data));
      } else if (error.request) {
        throw new Error('No response from server. Check your network or CORS settings.');
      } else {
        throw new Error(error.message || fallbackMessage);
      }
    } else {
      throw new Error(fallbackMessage);
    }
  }

  // Save session and user to localStorage
  private saveSession(authData: AuthResponse) {
    this.sessionToken = authData.session_token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('session_token', authData.session_token);
      localStorage.setItem('user', JSON.stringify(authData.user));
    }
  }

  // Register user
  async register(userData: RegisterData): Promise<AuthResponse> {
    if (userData.password !== userData.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    try {
      const response = await axios.post<AuthResponse>(
        `${API_BASE_URL}/api/auth/register`,
        {
          email: userData.email,
          password: userData.password,
          full_name: userData.full_name,
          phone: userData.phone,
          country: userData.country,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const authData = response.data;
      this.saveSession(authData);
      return authData;
    } catch (error) {
      this.handleAxiosError(error, 'Registration failed. Please try again.');
    }
  }

  // Login user
  async login(loginData: LoginData): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(
        `${API_BASE_URL}/api/auth/login`,
        {
          email: loginData.email,
          password: loginData.password,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const authData = response.data;
      this.saveSession(authData);
      return authData;
    } catch (error) {
      this.handleAxiosError(error, 'Login failed. Please check your credentials.');
    }
  }

  // Logout user
  async logout(): Promise<void> {
    console.log('Logout function called');
    // Always try to get session token from localStorage in case constructor didn't run
    const token = typeof window !== 'undefined' ? localStorage.getItem('session_token') : null;

    try {
      if (token) {
        await axios.post(
          `${API_BASE_URL}/api/auth/logout`,
          { session_token: token },
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      // Always clear session data from memory AND localStorage
      this.sessionToken = null;
      if (typeof window !== 'undefined') {
        // Make absolutely sure we remove the correct keys
        localStorage.removeItem('session_token');
        localStorage.removeItem('user');

        // Extra safety: clear all keys if you want
        Object.keys(localStorage).forEach(key => localStorage.removeItem(key));
      }
      console.log('LocalStorage cleared on logout.');
    }
  }


  // Clear session data
  private clearSession() {
    this.sessionToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('session_token');
      localStorage.removeItem('user');
    }
  }

  // Validate current session
  async validateSession(): Promise<User | null> {
    try {
      if (!this.sessionToken) return null;

      const response = await axios.post(
        `${API_BASE_URL}/api/auth/validate`,
        { session_token: this.sessionToken },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const userData: User = response.data.user;
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(userData));
      }
      return userData;
    } catch {
      this.clearSession();
      return null;
    }
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return this.sessionToken !== null;
  }

  // Get current user from localStorage
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  // Get session token
  getSessionToken(): string | null {
    return this.sessionToken;
  }
}

// Export singleton safely
export const authService =
  typeof window !== 'undefined' ? new AuthService() : ({} as AuthService);
