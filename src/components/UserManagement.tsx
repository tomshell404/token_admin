"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { userService, User, UserFilters } from '@/services/userService';
import UserDetailsModal from './UserDetailsModal';
import BalanceManagementModal from './BalanceManagementModal';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [filters, setFilters] = useState<UserFilters>({});
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const pageSize = 20;

  useEffect(() => {
    loadUsers();
  }, [currentPage, filters, searchTerm]);

  useEffect(() => {
    const unsubscribe = userService.onUsersUpdate(() => {
      loadUsers();
    });
    return unsubscribe;
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const filterParams = { ...filters };
      if (searchTerm) filterParams.searchTerm = searchTerm;

      const { users: userData, total } = await userService.getUsers(filterParams, currentPage, pageSize);
      setUsers(userData);
      setTotalUsers(total);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserAction = async (action: string, userId: string) => {
    try {
      switch (action) {
        case 'verify':
          await userService.verifyUser(userId);
          break;
        case 'suspend':
          const reason = prompt('Reason for suspension:');
          if (reason) await userService.suspendUser(userId, reason);
          break;
        case 'activate':
          await userService.activateUser(userId);
          break;
        case 'approve_kyc':
          await userService.updateKycStatus(userId, 'approved');
          break;
        case 'reject_kyc':
          const rejectReason = prompt('Reason for KYC rejection:');
          if (rejectReason) await userService.updateKycStatus(userId, 'rejected', rejectReason);
          break;
      }
      loadUsers();
    } catch (error) {
      console.error('Error performing user action:', error);
      alert('Error performing action. Please try again.');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      alert('Please select users first');
      return;
    }

    const confirmed = confirm(`Are you sure you want to ${action} ${selectedUsers.length} users?`);
    if (!confirmed) return;

    try {
      switch (action) {
        case 'verify':
          await userService.bulkVerifyUsers(selectedUsers);
          break;
        case 'activate':
          await userService.bulkUpdateStatus(selectedUsers, 'active');
          break;
        case 'suspend':
          await userService.bulkUpdateStatus(selectedUsers, 'suspended');
          break;
      }
      setSelectedUsers([]);
      loadUsers();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert('Error performing bulk action. Please try again.');
    }
  };

  const handleExport = async () => {
    const csvData = await userService.exportUsers(filters);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_export.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
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

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'not_submitted':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPages = Math.ceil(totalUsers / pageSize);

  return (
    <div className="p-6 space-y-6">
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>User Management</CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={handleExport} variant="outline">
                📊 Export CSV
              </Button>
              <Button onClick={() => {/* TODO: Add new user */}} className="bg-blue-600 hover:bg-blue-700">
                ➕ Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search users by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={filters.kycStatus || ''}
                onChange={(e) => setFilters({ ...filters, kycStatus: e.target.value || undefined })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All KYC</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="not_submitted">Not Submitted</option>
              </select>
              <select
                value={filters.verified?.toString() || ''}
                onChange={(e) => setFilters({ ...filters, verified: e.target.value ? e.target.value === 'true' : undefined })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Verified</option>
                <option value="true">Verified</option>
                <option value="false">Unverified</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm text-blue-800">
                {selectedUsers.length} users selected
              </span>
              <div className="flex gap-2 ml-auto">
                <Button size="sm" onClick={() => handleBulkAction('verify')} variant="outline">
                  ✅ Verify
                </Button>
                <Button size="sm" onClick={() => handleBulkAction('activate')} variant="outline">
                  🟢 Activate
                </Button>
                <Button size="sm" onClick={() => handleBulkAction('suspend')} variant="outline">
                  🔴 Suspend
                </Button>
                <Button size="sm" onClick={() => setSelectedUsers([])} variant="outline">
                  ❌ Clear
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading users...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(users.map(u => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>KYC</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                          }
                        }}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                            {user.fullName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{user.fullName}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <p className="text-xs text-gray-400">{user.country}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                        {user.verified && (
                          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                            ✅ Verified
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{formatCurrency(user.balance)}</p>
                        <p className="text-sm text-gray-500">
                          Deposited: {formatCurrency(user.totalDeposited)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getKycStatusColor(user.kycStatus)}>
                        {user.kycStatus.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {new Date(user.registeredAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Last login: {new Date(user.lastLogin).toLocaleDateString()}
                      </p>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            ⋮
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setShowUserDetails(true);
                          }}>
                            👁️ View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setShowBalanceModal(true);
                          }}>
                            💰 Manage Balance
                          </DropdownMenuItem>
                          {!user.verified && (
                            <DropdownMenuItem onClick={() => handleUserAction('verify', user.id)}>
                              ✅ Verify User
                            </DropdownMenuItem>
                          )}
                          {user.kycStatus === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => handleUserAction('approve_kyc', user.id)}>
                                ✅ Approve KYC
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUserAction('reject_kyc', user.id)}>
                                ❌ Reject KYC
                              </DropdownMenuItem>
                            </>
                          )}
                          {user.status === 'active' ? (
                            <DropdownMenuItem onClick={() => handleUserAction('suspend', user.id)} className="text-red-600">
                              🔴 Suspend
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleUserAction('activate', user.id)} className="text-green-600">
                              🟢 Activate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm bg-gray-100 rounded">
                  {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedUser && (
        <>
          <UserDetailsModal
            user={selectedUser}
            open={showUserDetails}
            onClose={() => {
              setShowUserDetails(false);
              setSelectedUser(null);
            }}
            onUpdate={loadUsers}
          />
          <BalanceManagementModal
            user={selectedUser}
            open={showBalanceModal}
            onClose={() => {
              setShowBalanceModal(false);
              setSelectedUser(null);
            }}
            onUpdate={loadUsers}
          />
        </>
      )}
    </div>
  );
}
