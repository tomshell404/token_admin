import axios from "axios";

// Base URL of your backend
const API_BASE_URL = "http://localhost/token-trade-clone/backend/api/auth/admin";

export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

export interface AdminLoginData {
  email: string;
  password: string;
}

export interface AdminAuthResponse {
  success: boolean;
  message: string;
  user: AdminUser;
  session_token: string;
}

class AdminAuthService {
  private sessionToken: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.sessionToken = localStorage.getItem("admin_session_token");
    }
  }

  // Centralized error handler
  private handleAxiosError(error: unknown, fallbackMessage: string): never {
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.request) {
        throw new Error("No response from server. Check your network or CORS settings.");
      } else {
        throw new Error(error.message || fallbackMessage);
      }
    } else {
      throw new Error(fallbackMessage);
    }
  }

  // Save session and admin user to localStorage
  private saveSession(authData: AdminAuthResponse) {
    this.sessionToken = authData.session_token;
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_session_token", authData.session_token);
      localStorage.setItem("admin_user", JSON.stringify(authData.user));
    }
  }

  // Login admin
  async login(loginData: AdminLoginData): Promise<AdminAuthResponse> {
    try {
      const response = await axios.post<AdminAuthResponse>(
        `${API_BASE_URL}/admin_login.php`,
        {
          email: loginData.email,
          password: loginData.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Invalid email or password");
      }

      const authData = response.data;
      this.saveSession(authData);
      return authData;
    } catch (error) {
      this.handleAxiosError(error, "Admin login failed");
    }
  }

  // Logout admin
  logout(): void {
    this.sessionToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_session_token");
      localStorage.removeItem("admin_user");
    }
  }

  // Check if admin is logged in
  isLoggedIn(): boolean {
    return this.sessionToken !== null;
  }

  // Get current admin user
  getCurrentUser(): AdminUser | null {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("admin_user");
    return userStr ? JSON.parse(userStr) : null;
  }

  // Get session token
  getSessionToken(): string | null {
    return this.sessionToken;
  }
}

// Export singleton
export const adminAuthService =
  typeof window !== "undefined" ? new AdminAuthService() : ({} as AdminAuthService);
