export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  country: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  verified: boolean;
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalProfit: number;
  totalTrades: number;
  winRate: number;
  lastLogin: string;
  registeredAt: string;
  referralCode: string;
  referredBy?: string;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  kycDocuments?: {
    id: string;
    type: 'passport' | 'drivers_license' | 'national_id';
    url: string;
    uploadedAt: string;
  }[];
  notes?: string;
  riskLevel: 'low' | 'medium' | 'high';
  tags: string[];
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'trade' | 'bonus' | 'fee';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'rejected'; // ✅ added 'rejected'
  txHash?: string;
  description: string;
  createdAt: string;
  completedAt?: string;
  adminNotes?: string;
}


export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingVerifications: number;
  suspendedUsers: number;
}

export interface UserFilters {
  status?: string;
  verified?: boolean;
  kycStatus?: string;
  riskLevel?: string;
  country?: string;
  registeredAfter?: string;
  registeredBefore?: string;
  minBalance?: number;
  maxBalance?: number;
  searchTerm?: string;
}

class UserService {
  private updateCallbacks: Array<() => void> = [];
  private initialized = false;

  constructor() {
    this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    if (this.initialized) return;

    try {
      const response = await fetch('/api/database/init', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Database initialization failed');
      }

      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      // Don't throw error in constructor, let individual methods handle it
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializeDatabase();
    }
  }

  // CRUD Operations
  async getUsers(filters?: UserFilters, page = 1, limit = 50): Promise<{ users: User[]; total: number }> {
    await this.ensureInitialized();

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Add filters to params
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await fetch(`/api/users?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users from database');
    }
  }

  async getUserById(id: string): Promise<User | null> {
    await this.ensureInitialized();

    try {
      const response = await fetch(`/api/users/${id}`);
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw new Error('Failed to fetch user from database');
    }
  }

  async createUser(userData: Omit<User, 'id' | 'registeredAt' | 'referralCode'>): Promise<User> {
    await this.ensureInitialized();

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      const newUser = await response.json();
      this.notifyCallbacks();
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user in database');
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    await this.ensureInitialized();

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      const updatedUser = await response.json();
      this.notifyCallbacks();
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user in database');
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    await this.ensureInitialized();

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      if (response.status === 404) {
        return false;
      }
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      this.notifyCallbacks();
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user from database');
    }
  }

  // Balance Management
  async updateUserBalance(id: string, amount: number, type: 'add' | 'subtract', reason: string): Promise<Transaction | null> {
    await this.ensureInitialized();

    try {
      const response = await fetch(`/api/users/${id}/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, type, reason }),
      });

      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update balance');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating user balance:', error);
      throw error;
    }
  }

  // User Status Management
  async verifyUser(id: string): Promise<boolean> {
    const updated = await this.updateUser(id, { verified: true });
    return !!updated;
  }

  async suspendUser(id: string, reason: string): Promise<boolean> {
    const updated = await this.updateUser(id, {
      status: 'suspended',
      notes: reason
    });
    return !!updated;
  }

  async activateUser(id: string): Promise<boolean> {
    const updated = await this.updateUser(id, { status: 'active' });
    return !!updated;
  }

  async updateKycStatus(id: string, status: User['kycStatus'], notes?: string): Promise<boolean> {
    const updates: Partial<User> = { kycStatus: status };
    if (notes) updates.notes = notes;

    const updated = await this.updateUser(id, updates);
    return !!updated;
  }

  // Transaction Management
  async getUserTransactions(userId: string, limit = 50): Promise<Transaction[]> {
    await this.ensureInitialized();

    try {
      const params = new URLSearchParams({
        userId: userId,
        limit: limit.toString(),
      });

      const response = await fetch(`/api/transactions?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user transactions');
      }

      const data = await response.json();
      return data.transactions;
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      throw new Error('Failed to fetch user transactions');
    }
  }

  async getAllTransactions(filters?: { status?: string; type?: string }, page = 1, limit = 50): Promise<{ transactions: Transaction[]; total: number }> {
    await this.ensureInitialized();

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            params.append(key, value);
          }
        });
      }

      const response = await fetch(`/api/transactions?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new Error('Failed to fetch transactions');
    }
  }

  async approveTransaction(id: string): Promise<boolean> {
    const response = await fetch(`http://localhost/token-trade-clone/backend/api/auth/admin/approve_transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ id }),
    });

    if (!response.ok) throw new Error('Failed to approve transaction');
    return true;
  }


  async rejectTransaction(id: string, reason: string): Promise<boolean> {
    const response = await fetch(`http://localhost/token-trade-clone/backend/api/auth/admin/reject_transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ id, reason}),
    });

    if (!response.ok) throw new Error('Failed to reject transaction');
    return true;
  }


  async getTransactionById(id: string): Promise<Transaction> {
    const response = await fetch(`http://localhost/token-trade-clone/backend/api/auth/admin/get_transaction?id=${id}`);
    if (!response.ok) throw new Error('Transaction not found');
    return await response.json();
  }


  // Analytics and Statistics
  async getUserStats(): Promise<UserStats> {
    await this.ensureInitialized();

    try {
      const response = await fetch('/api/users/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch user statistics');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw new Error('Failed to fetch user statistics');
    }
  }

  async getCountryStats(): Promise<{ country: string; count: number }[]> {
    await this.ensureInitialized();

    try {
      const response = await fetch('/api/analytics/countries');
      if (!response.ok) {
        throw new Error('Failed to fetch country statistics');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching country stats:', error);
      throw new Error('Failed to fetch country statistics');
    }
  }

  async getRegistrationChart(days = 30): Promise<{ date: string; count: number }[]> {
    await this.ensureInitialized();

    try {
      const response = await fetch(`/api/analytics/registration-chart?days=${days}`);
      if (!response.ok) {
        throw new Error('Failed to fetch registration chart data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching registration chart:', error);
      throw new Error('Failed to fetch registration chart data');
    }
  }

  // Bulk Operations
  async bulkUpdateStatus(userIds: string[], status: User['status']): Promise<number> {
    await this.ensureInitialized();

    try {
      const response = await fetch('/api/users/bulk/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds, status }),
      });

      if (!response.ok) {
        throw new Error('Failed to bulk update user status');
      }

      const data = await response.json();
      this.notifyCallbacks();
      return data.affectedRows;
    } catch (error) {
      console.error('Error bulk updating status:', error);
      throw new Error('Failed to bulk update user status');
    }
  }

  async bulkVerifyUsers(userIds: string[]): Promise<number> {
    await this.ensureInitialized();

    try {
      const response = await fetch('/api/users/bulk/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to bulk verify users');
      }

      const data = await response.json();
      this.notifyCallbacks();
      return data.affectedRows;
    } catch (error) {
      console.error('Error bulk verifying users:', error);
      throw new Error('Failed to bulk verify users');
    }
  }

  // Export/Import
  async exportUsers(filters?: UserFilters): Promise<string> {
    const { users } = await this.getUsers(filters, 1, 10000); // Get all users
    const csvData = [
      ['ID', 'Email', 'Full Name', 'Country', 'Status', 'Verified', 'Balance', 'Registered At'],
      ...users.map((u: User) => [
        u.id,
        u.email,
        u.fullName,
        u.country,
        u.status,
        u.verified.toString(),
        u.balance.toString(),
        u.registeredAt
      ])
    ];

    return csvData.map(row => row.join(',')).join('\n');
  }

  // Search and Filters
  async searchUsers(query: string, limit = 20): Promise<User[]> {
    const { users } = await this.getUsers({ searchTerm: query }, 1, limit);
    return users;
  }

  // Subscription Management
  onUsersUpdate(callback: () => void): () => void {
    this.updateCallbacks.push(callback);
    return () => {
      this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyCallbacks(): void {
    this.updateCallbacks.forEach(callback => callback());
  }
}

export const userService = new UserService();
