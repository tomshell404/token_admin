"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { chatService, AdminUser } from "@/services/chatService";

interface AdminContextType {
  currentAdmin: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateAdminStatus: (status: AdminUser["status"]) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored admin session on mount
    const stored = typeof window !== "undefined" ? localStorage.getItem("admin-session") : null;
    if (stored) {
      try {
        const admin = JSON.parse(stored);
        setCurrentAdmin(admin);
        chatService.updateAdminStatus(admin.id, "online");
      } catch {
        localStorage.removeItem("admin-session");
      }
    }
    setIsLoading(false);

    const handleVisibilityChange = () => {
      if (currentAdmin) {
        const status = document.hidden ? "away" : "online";
        chatService.updateAdminStatus(currentAdmin.id, status);
        setCurrentAdmin(prev => (prev ? { ...prev, status } : null));
        if (typeof window !== "undefined") {
          localStorage.setItem("admin-session", JSON.stringify({ ...currentAdmin, status }));
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [currentAdmin?.id]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost/token-trade-clone/backend/api/auth/admin/admin_login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        const admin: AdminUser = {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          status: "online",
          name: data.user.full_name || "", // map full_name from backend if it exists
          activeConversations: 0,          // initial value
          totalResolved: 0,                // initial value
          avgResponseTime: 0,              // initial value
        };

        setCurrentAdmin(admin);

        if (typeof window !== "undefined") {
          localStorage.setItem("admin-session", JSON.stringify(admin));
        }

        chatService.updateAdminStatus(admin.id, "online");
        return true;
      }


      return false;
    } catch (err) {
      console.error("Login error:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (currentAdmin) {
      chatService.logout();
      setCurrentAdmin(null);
      if (typeof window !== "undefined") localStorage.removeItem("admin-session");
    }
  };

  const updateAdminStatus = (status: AdminUser["status"]) => {
    if (currentAdmin) {
      chatService.updateAdminStatus(currentAdmin.id, status);
      const updatedAdmin = { ...currentAdmin, status };
      setCurrentAdmin(updatedAdmin);
      if (typeof window !== "undefined") {
        localStorage.setItem("admin-session", JSON.stringify(updatedAdmin));
      }
    }
  };

  return (
    <AdminContext.Provider
      value={{
        currentAdmin,
        isLoading,
        login,
        logout,
        updateAdminStatus,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin must be used within an AdminProvider");
  return context;
}
