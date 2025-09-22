export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'user' | 'admin';
  senderName: string;
  message: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  attachments?: {
    id: string;
    type: 'image' | 'file';
    url: string;
    name: string;
    size: number;
  }[];
}

export interface ChatConversation {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'active' | 'closed' | 'waiting';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string; // Admin ID
  assignedToName?: string;
  subject: string;
  category: 'support' | 'billing' | 'technical' | 'kyc' | 'general';
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
  closedAt?: string;
  tags: string[];
  unreadCount: number;
  customerSatisfaction?: 1 | 2 | 3 | 4 | 5;
  resolution?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'support' | 'manager';
  status: 'online' | 'away' | 'offline';
  avatar?: string;
  activeConversations: number;
  totalResolved: number;
  avgResponseTime: number; // in minutes
}

export interface ChatStats {
  totalConversations: number;
  activeConversations: number;
  avgResponseTime: number;
  satisfactionRating: number;
  resolvedToday: number;
  pendingConversations: number;
  onlineAgents: number;
}

class ChatService {
  private conversations: ChatConversation[] = [];
  private messages: ChatMessage[] = [];
  private admins: AdminUser[] = [];
  private currentAdmin: AdminUser | null = null;
  private updateCallbacks: Array<() => void> = [];
  private messageCallbacks: Array<(conversationId: string) => void> = [];

  constructor() {
    this.loadData();
    this.initializeMockData();
    this.startTypingSimulation();
  }

  // Authentication
  login(email: string, password: string): AdminUser | null {
    // Mock authentication - in real app, this would be proper auth
    const admin = this.admins.find(a => a.email === email);
    if (admin && password) {
      this.currentAdmin = { ...admin, status: 'online' };
      this.updateAdminStatus(admin.id, 'online');
      return this.currentAdmin;
    }
    return null;
  }

  logout(): void {
    if (this.currentAdmin) {
      this.updateAdminStatus(this.currentAdmin.id, 'offline');
      this.currentAdmin = null;
    }
  }

  getCurrentAdmin(): AdminUser | null {
    return this.currentAdmin;
  }

  // Conversation Management
  async getConversations(filters?: {
    status?: string;
    priority?: string;
    category?: string;
    assignedTo?: string;
  }): Promise<ChatConversation[]> {
    let filtered = [...this.conversations];

    if (filters) {
      if (filters.status) {
        filtered = filtered.filter(c => c.status === filters.status);
      }
      if (filters.priority) {
        filtered = filtered.filter(c => c.priority === filters.priority);
      }
      if (filters.category) {
        filtered = filtered.filter(c => c.category === filters.category);
      }
      if (filters.assignedTo) {
        filtered = filtered.filter(c => c.assignedTo === filters.assignedTo);
      }
    }

    return filtered.sort((a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }

  async getConversationById(id: string): Promise<ChatConversation | null> {
    return this.conversations.find(c => c.id === id) || null;
  }

  async createConversation(userId: string, userName: string, userEmail: string, subject: string, category: ChatConversation['category']): Promise<ChatConversation> {
    const conversation: ChatConversation = {
      id: this.generateId('conv'),
      userId,
      userName,
      userEmail,
      status: 'waiting',
      priority: 'medium',
      subject,
      category,
      lastMessage: 'Conversation started',
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      tags: [],
      unreadCount: 0,
    };

    this.conversations.unshift(conversation);
    this.saveData();
    this.notifyCallbacks();
    return conversation;
  }

  async updateConversation(id: string, updates: Partial<ChatConversation>): Promise<ChatConversation | null> {
    const index = this.conversations.findIndex(c => c.id === id);
    if (index === -1) return null;

    this.conversations[index] = { ...this.conversations[index], ...updates };
    this.saveData();
    this.notifyCallbacks();
    return this.conversations[index];
  }

  async assignConversation(conversationId: string, adminId: string): Promise<boolean> {
    const admin = this.admins.find(a => a.id === adminId);
    if (!admin) return false;

    const updated = await this.updateConversation(conversationId, {
      assignedTo: adminId,
      assignedToName: admin.name,
      status: 'active'
    });

    return !!updated;
  }

  async closeConversation(conversationId: string, resolution?: string, satisfaction?: 1 | 2 | 3 | 4 | 5): Promise<boolean> {
    const updates: Partial<ChatConversation> = {
      status: 'closed',
      closedAt: new Date().toISOString(),
    };

    if (resolution) updates.resolution = resolution;
    if (satisfaction) updates.customerSatisfaction = satisfaction;

    const updated = await this.updateConversation(conversationId, updates);
    return !!updated;
  }

  // Message Management
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    return this.messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async sendMessage(conversationId: string, message: string, attachments?: ChatMessage['attachments']): Promise<ChatMessage | null> {
    if (!this.currentAdmin) return null;

    const chatMessage: ChatMessage = {
      id: this.generateId('msg'),
      conversationId,
      senderId: this.currentAdmin.id,
      senderType: 'admin',
      senderName: this.currentAdmin.name,
      message,
      timestamp: new Date().toISOString(),
      status: 'sent',
      attachments,
    };

    this.messages.push(chatMessage);

    // Update conversation
    await this.updateConversation(conversationId, {
      lastMessage: message,
      lastMessageAt: chatMessage.timestamp,
      unreadCount: 0,
    });

    this.saveData();
    this.notifyMessageCallbacks(conversationId);
    return chatMessage;
  }

  async markAsRead(conversationId: string): Promise<void> {
    // Mark all messages in conversation as read
    this.messages
      .filter(m => m.conversationId === conversationId && m.senderType === 'user')
      .forEach(m => m.status = 'read');

    // Reset unread count
    await this.updateConversation(conversationId, { unreadCount: 0 });
    this.saveData();
  }

  // Admin Management
  getAdmins(): AdminUser[] {
    return this.admins;
  }

  async updateAdminStatus(adminId: string, status: AdminUser['status']): Promise<void> {
    const admin = this.admins.find(a => a.id === adminId);
    if (admin) {
      admin.status = status;
      this.saveData();
      this.notifyCallbacks();
    }
  }

  getOnlineAdmins(): AdminUser[] {
    return this.admins.filter(a => a.status === 'online');
  }

  // Analytics and Statistics
  getChatStats(): ChatStats {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const totalConversations = this.conversations.length;
    const activeConversations = this.conversations.filter(c => c.status === 'active').length;
    const pendingConversations = this.conversations.filter(c => c.status === 'waiting').length;
    const resolvedToday = this.conversations.filter(c =>
      c.status === 'closed' && c.closedAt && new Date(c.closedAt) >= today
    ).length;

    // Calculate average response time (mock calculation)
    const avgResponseTime = this.conversations.reduce((sum, conv) => {
      return sum + (Math.random() * 30 + 5); // 5-35 minutes mock
    }, 0) / totalConversations || 0;

    // Calculate satisfaction rating
    const ratedConversations = this.conversations.filter(c => c.customerSatisfaction);
    const satisfactionRating = ratedConversations.length > 0
      ? ratedConversations.reduce((sum, c) => sum + (c.customerSatisfaction || 0), 0) / ratedConversations.length
      : 0;

    const onlineAgents = this.admins.filter(a => a.status === 'online').length;

    return {
      totalConversations,
      activeConversations,
      avgResponseTime,
      satisfactionRating,
      resolvedToday,
      pendingConversations,
      onlineAgents,
    };
  }

  getResponseTimeChart(days = 7): { date: string; avgTime: number }[] {
    const chart = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      // Mock response time data
      const avgTime = Math.random() * 25 + 10; // 10-35 minutes

      chart.push({ date: dateString, avgTime });
    }

    return chart;
  }

  // Auto-assignment based on workload
  async autoAssignConversation(conversationId: string): Promise<boolean> {
    const onlineAdmins = this.getOnlineAdmins();
    if (onlineAdmins.length === 0) return false;

    // Find admin with lowest active conversations
    const leastBusyAdmin = onlineAdmins.reduce((min, admin) =>
      admin.activeConversations < min.activeConversations ? admin : min
    );

    return await this.assignConversation(conversationId, leastBusyAdmin.id);
  }

  // Search functionality
  async searchConversations(query: string): Promise<ChatConversation[]> {
    const lowercaseQuery = query.toLowerCase();
    return this.conversations.filter(c =>
      c.userName.toLowerCase().includes(lowercaseQuery) ||
      c.userEmail.toLowerCase().includes(lowercaseQuery) ||
      c.subject.toLowerCase().includes(lowercaseQuery) ||
      c.lastMessage.toLowerCase().includes(lowercaseQuery)
    );
  }

  async searchMessages(query: string, conversationId?: string): Promise<ChatMessage[]> {
    const lowercaseQuery = query.toLowerCase();
    let filtered = this.messages.filter(m =>
      m.message.toLowerCase().includes(lowercaseQuery)
    );

    if (conversationId) {
      filtered = filtered.filter(m => m.conversationId === conversationId);
    }

    return filtered.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Real-time updates
  onConversationsUpdate(callback: () => void): () => void {
    this.updateCallbacks.push(callback);
    return () => {
      this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
    };
  }

  onMessagesUpdate(conversationId: string, callback: () => void): () => void {
    const wrappedCallback = (id: string) => {
      if (id === conversationId) callback();
    };
    this.messageCallbacks.push(wrappedCallback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== wrappedCallback);
    };
  }

  private notifyCallbacks(): void {
    this.updateCallbacks.forEach(callback => callback());
  }

  private notifyMessageCallbacks(conversationId: string): void {
    this.messageCallbacks.forEach(callback => callback(conversationId));
  }

  // Typing simulation for demo
  private startTypingSimulation(): void {
    setInterval(() => {
      const activeConversations = this.conversations.filter(c => c.status === 'active');
      if (activeConversations.length > 0 && Math.random() < 0.1) {
        const randomConv = activeConversations[Math.floor(Math.random() * activeConversations.length)];
        this.simulateUserMessage(randomConv.id);
      }
    }, 15000); // Every 15 seconds, 10% chance
  }

  private simulateUserMessage(conversationId: string): void {
    const messages = [
      "Thank you for your help!",
      "Could you please clarify this for me?",
      "I'm still having issues with my account.",
      "When will this be resolved?",
      "I appreciate your quick response.",
      "Is there anything else I need to do?",
    ];

    const conversation = this.conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    const message: ChatMessage = {
      id: this.generateId('msg'),
      conversationId,
      senderId: conversation.userId,
      senderType: 'user',
      senderName: conversation.userName,
      message: messages[Math.floor(Math.random() * messages.length)],
      timestamp: new Date().toISOString(),
      status: 'sent',
    };

    this.messages.push(message);

    // Update conversation
    this.updateConversation(conversationId, {
      lastMessage: message.message,
      lastMessageAt: message.timestamp,
      unreadCount: (conversation.unreadCount || 0) + 1,
    });

    this.saveData();
    this.notifyMessageCallbacks(conversationId);
  }

  // Private helpers
  private generateId(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadData(): void {
    if (typeof window !== 'undefined') {
      const savedConversations = localStorage.getItem('admin-conversations');
      const savedMessages = localStorage.getItem('admin-messages');
      const savedAdmins = localStorage.getItem('admin-admins');

      if (savedConversations) {
        this.conversations = JSON.parse(savedConversations);
      }
      if (savedMessages) {
        this.messages = JSON.parse(savedMessages);
      }
      if (savedAdmins) {
        this.admins = JSON.parse(savedAdmins);
      }
    }
  }

  private saveData(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-conversations', JSON.stringify(this.conversations));
      localStorage.setItem('admin-messages', JSON.stringify(this.messages));
      localStorage.setItem('admin-admins', JSON.stringify(this.admins));
    }
  }

  private initializeMockData(): void {
    // Initialize admins if empty
    if (this.admins.length === 0) {
      this.admins = [
        {
          id: 'admin_1',
          name: 'Sarah Wilson',
          email: 'sarah@tokentrade.com',
          role: 'manager',
          status: 'online',
          activeConversations: 3,
          totalResolved: 156,
          avgResponseTime: 8.5,
        },
        {
          id: 'admin_2',
          name: 'Michael Chen',
          email: 'michael@tokentrade.com',
          role: 'support',
          status: 'online',
          activeConversations: 5,
          totalResolved: 89,
          avgResponseTime: 12.3,
        },
        {
          id: 'admin_3',
          name: 'Emma Rodriguez',
          email: 'emma@tokentrade.com',
          role: 'support',
          status: 'away',
          activeConversations: 2,
          totalResolved: 67,
          avgResponseTime: 15.1,
        },
      ];
    }

    // Initialize conversations if empty
    if (this.conversations.length === 0) {
      this.conversations = [
        {
          id: 'conv_1',
          userId: 'usr_1',
          userName: 'John Doe',
          userEmail: 'john.doe@example.com',
          status: 'active',
          priority: 'high',
          assignedTo: 'admin_1',
          assignedToName: 'Sarah Wilson',
          subject: 'Account Verification Issue',
          category: 'kyc',
          lastMessage: 'I submitted my documents 3 days ago but still no response.',
          lastMessageAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          tags: ['urgent', 'kyc'],
          unreadCount: 2,
        },
        {
          id: 'conv_2',
          userId: 'usr_2',
          userName: 'Jane Smith',
          userEmail: 'jane.smith@example.com',
          status: 'waiting',
          priority: 'medium',
          subject: 'Withdrawal Problem',
          category: 'support',
          lastMessage: 'My withdrawal has been pending for 24 hours.',
          lastMessageAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          tags: ['withdrawal'],
          unreadCount: 1,
        },
        {
          id: 'conv_3',
          userId: 'usr_3',
          userName: 'Mike Johnson',
          userEmail: 'mike.johnson@example.com',
          status: 'closed',
          priority: 'low',
          assignedTo: 'admin_2',
          assignedToName: 'Michael Chen',
          subject: 'General Question',
          category: 'general',
          lastMessage: 'Thank you for your help!',
          lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
          closedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          tags: ['resolved'],
          unreadCount: 0,
          customerSatisfaction: 5,
          resolution: 'User question answered successfully.',
        },
      ];

      // Initialize some messages
      this.messages = [
        {
          id: 'msg_1',
          conversationId: 'conv_1',
          senderId: 'usr_1',
          senderType: 'user',
          senderName: 'John Doe',
          message: 'I submitted my documents 3 days ago but still no response.',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          status: 'sent',
        },
        {
          id: 'msg_2',
          conversationId: 'conv_1',
          senderId: 'admin_1',
          senderType: 'admin',
          senderName: 'Sarah Wilson',
          message: 'Thank you for contacting us. I\'m checking your verification status now.',
          timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
          status: 'sent',
        },
      ];
    }

    this.saveData();
  }
}

export const chatService = new ChatService();
