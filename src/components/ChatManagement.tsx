"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { chatService, ChatConversation, ChatMessage, ChatStats } from '@/services/chatService';
import { useAdmin } from './AdminProvider';

export default function ChatManagement() {
  const { currentAdmin } = useAdmin();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    loadStats();

    const unsubscribe = chatService.onConversationsUpdate(() => {
      loadConversations();
      loadStats();
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      chatService.markAsRead(selectedConversation.id);

      const unsubscribe = chatService.onMessagesUpdate(selectedConversation.id, () => {
        loadMessages(selectedConversation.id);
      });

      return unsubscribe;
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const filterParams: Record<string, string> = {};

      if (filter !== 'all') {
        if (filter === 'my_conversations') {
          if (currentAdmin?.id) filterParams.assignedTo = currentAdmin.id;
        } else {
          filterParams.status = filter;
        }
      }

      const convos = await chatService.getConversations(filterParams);

      // Apply search filter
      const filteredConvos = searchTerm
        ? convos.filter(c =>
            c.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.subject.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : convos;

      setConversations(filteredConvos);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const msgs = await chatService.getMessages(conversationId);
      setMessages(msgs);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadStats = () => {
    const chatStats = chatService.getChatStats();
    setStats(chatStats);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentAdmin) return;

    setIsSending(true);
    try {
      await chatService.sendMessage(selectedConversation.id, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleAssignToMe = async (conversationId: string) => {
    if (!currentAdmin) return;

    try {
      await chatService.assignConversation(conversationId, currentAdmin.id);
      loadConversations();
    } catch (error) {
      console.error('Error assigning conversation:', error);
    }
  };

  const handleCloseConversation = async (conversationId: string) => {
    const resolution = prompt('Please provide a resolution summary:');
    if (!resolution) return;

    try {
      await chatService.closeConversation(conversationId, resolution);
      setSelectedConversation(null);
      loadConversations();
    } catch (error) {
      console.error('Error closing conversation:', error);
    }
  };

  const handleUpdatePriority = async (conversationId: string, priority: string) => {
    try {
      await chatService.updateConversation(conversationId, { priority: priority as "low" | "medium" | "high" });
      loadConversations();
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.activeConversations}</div>
              <p className="text-sm text-gray-600">Active Chats</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingConversations}</div>
              <p className="text-sm text-gray-600">Waiting</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.resolvedToday}</div>
              <p className="text-sm text-gray-600">Resolved Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.avgResponseTime.toFixed(1)}m</div>
              <p className="text-sm text-gray-600">Avg Response</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.satisfactionRating.toFixed(1)}</div>
              <p className="text-sm text-gray-600">Satisfaction</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.onlineAgents}</div>
              <p className="text-sm text-gray-600">Agents Online</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Conversations</CardTitle>
              <Badge variant="secondary">{conversations.length}</Badge>
            </div>

            <div className="space-y-2">
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Conversations</option>
                <option value="waiting">Waiting</option>
                <option value="active">Active</option>
                <option value="my_conversations">My Conversations</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                          {conversation.userName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{conversation.userName}</p>
                        <p className="text-xs text-gray-500">{conversation.category}</p>
                      </div>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <Badge className="bg-red-100 text-red-600">{conversation.unreadCount}</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getStatusColor(conversation.status)}>
                      {conversation.status}
                    </Badge>
                    <Badge className={getPriorityColor(conversation.priority)}>
                      {conversation.priority}
                    </Badge>
                  </div>

                  <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">
                    {conversation.subject}
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {conversation.lastMessage}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatTime(conversation.lastMessageAt)}</span>
                    {conversation.assignedToName && (
                      <span>Assigned to {conversation.assignedToName}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {selectedConversation.userName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{selectedConversation.userName}</h3>
                      <p className="text-sm text-gray-500">{selectedConversation.userEmail}</p>
                      <p className="text-sm font-medium">{selectedConversation.subject}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Priority: {selectedConversation.priority}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleUpdatePriority(selectedConversation.id, 'low')}>
                          Low
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdatePriority(selectedConversation.id, 'medium')}>
                          Medium
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdatePriority(selectedConversation.id, 'high')}>
                          High
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdatePriority(selectedConversation.id, 'urgent')}>
                          Urgent
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {selectedConversation.status === 'waiting' && (
                      <Button
                        size="sm"
                        onClick={() => handleAssignToMe(selectedConversation.id)}
                      >
                        Assign to Me
                      </Button>
                    )}

                    {selectedConversation.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCloseConversation(selectedConversation.id)}
                      >
                        Close
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderType === 'admin'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.senderType === 'admin' ? 'text-blue-200' : 'text-gray-500'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                {selectedConversation.status !== 'closed' && (
                  <div className="border-t border-gray-200 p-4">
                    <div className="flex gap-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        rows={3}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isSending}
                        className="self-end"
                      >
                        {isSending ? 'Sending...' : 'Send'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💬</span>
                </div>
                <p className="text-gray-500">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
