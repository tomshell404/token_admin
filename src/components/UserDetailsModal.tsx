"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { userService, User, Transaction } from '@/services/userService';

interface UserDetailsModalProps {
  user: User;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function UserDetailsModal({ user, open, onClose, onUpdate }: UserDetailsModalProps) {
  const [editedUser, setEditedUser] = useState<User>(user);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notes, setNotes] = useState(user.notes || '');

  useEffect(() => {
    setEditedUser(user);
    setNotes(user.notes || '');
    loadUserTransactions();
  }, [user]);

  const loadUserTransactions = async () => {
    try {
      const userTransactions = await userService.getUserTransactions(user.id);
      setTransactions(userTransactions);
    } catch (error) {
      console.error('Error loading user transactions:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await userService.updateUser(user.id, { ...editedUser, notes });
      onUpdate();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedUser(user);
    setNotes(user.notes || '');
    setIsEditing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {user.fullName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{user.fullName}</h2>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </DialogTitle>
          <DialogDescription>
            User ID: {user.id} | Registered: {new Date(user.registeredAt).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[60vh] mt-4">
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Personal Information</CardTitle>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button onClick={handleCancel} variant="outline" size="sm">
                          Cancel
                        </Button>
                        <Button onClick={handleSave} size="sm" disabled={isSaving}>
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setIsEditing(true)} size="sm">
                        ✏️ Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={editedUser.fullName}
                        onChange={(e) => setEditedUser({ ...editedUser, fullName: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={editedUser.email}
                        onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={editedUser.phone || ''}
                        onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={editedUser.country}
                        onChange={(e) => setEditedUser({ ...editedUser, country: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        value={editedUser.status}
                        onChange={(e) => setEditedUser({ ...editedUser, status: e.target.value as User['status'] })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="kycStatus">KYC Status</Label>
                      <select
                        id="kycStatus"
                        value={editedUser.kycStatus}
                        onChange={(e) => setEditedUser({ ...editedUser, kycStatus: e.target.value as User['kycStatus'] })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="not_submitted">Not Submitted</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="riskLevel">Risk Level</Label>
                      <select
                        id="riskLevel"
                        value={editedUser.riskLevel}
                        onChange={(e) => setEditedUser({ ...editedUser, riskLevel: e.target.value as User['riskLevel'] })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Admin Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      disabled={!isEditing}
                      rows={3}
                      placeholder="Add notes about this user..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="verified"
                      checked={editedUser.verified}
                      onChange={(e) => setEditedUser({ ...editedUser, verified: e.target.checked })}
                      disabled={!isEditing}
                      className="rounded"
                    />
                    <Label htmlFor="verified">Email Verified</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status & Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                    <Badge className={getRiskLevelColor(user.riskLevel)}>
                      Risk: {user.riskLevel}
                    </Badge>
                    {user.verified && (
                      <Badge className="bg-green-100 text-green-800">
                        ✅ Verified
                      </Badge>
                    )}
                    {user.tags.map(tag => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Referral Code: <span className="font-mono">{user.referralCode}</span></p>
                    {user.referredBy && (
                      <p>Referred by: <span className="font-mono">{user.referredBy}</span></p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {formatCurrency(user.balance)}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Total Deposited: {formatCurrency(user.totalDeposited)}</p>
                      <p>Total Withdrawn: {formatCurrency(user.totalWithdrawn)}</p>
                      <p className={`${user.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Total Profit: {formatCurrency(user.totalProfit)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Trading Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Trades:</span>
                        <span className="font-medium">{user.totalTrades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Win Rate:</span>
                        <span className="font-medium text-green-600">{user.winRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Login:</span>
                        <span className="font-medium">{new Date(user.lastLogin).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Security Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>KYC Status</Label>
                        <Badge className={getStatusColor(user.kycStatus)}>
                          {user.kycStatus.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div>
                        <Label>Risk Assessment</Label>
                        <Badge className={getRiskLevelColor(user.riskLevel)}>
                          {user.riskLevel} risk
                        </Badge>
                      </div>
                    </div>

                    {user.kycDocuments && user.kycDocuments.length > 0 && (
                      <div>
                        <Label>KYC Documents</Label>
                        <div className="space-y-2 mt-2">
                          {user.kycDocuments.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div>
                                <p className="font-medium">{doc.type.replace('_', ' ')}</p>
                                <p className="text-sm text-gray-500">
                                  Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Button size="sm" variant="outline">
                                View
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transactions.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No transactions found</p>
                    ) : (
                      transactions.slice(0, 10).map(transaction => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium capitalize">
                              {transaction.type} - {formatCurrency(Math.abs(transaction.amount))}
                            </p>
                            <p className="text-sm text-gray-500">{transaction.description}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(transaction.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
