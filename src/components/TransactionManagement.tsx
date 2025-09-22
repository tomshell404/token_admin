"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";


import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// Removed duplicate Dialog import
import { userService, Transaction } from '@/services/userService';

// Type definitions
interface TransactionFilters {
  status?: string;
  type?: string;
  [key: string]: string | undefined;
}

interface TransactionStats {
  totalAmount: number;
  pendingCount: number;
  completedToday: number;
  failedCount: number;
}

export default function TransactionManagement() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [stats, setStats] = useState<TransactionStats>({
    totalAmount: 0,
    pendingCount: 0,
    completedToday: 0,
    failedCount: 0,
  });

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const pageSize = 20;

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: TransactionFilters = {};
      if (statusFilter) filters.status = statusFilter;
      if (typeFilter) filters.type = typeFilter;

      const result = await userService.getAllTransactions(filters, currentPage, pageSize);

      setTransactions(result.transactions);
      setTotalTransactions(result.total);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, typeFilter, searchTerm]);

  const calculateStats = useCallback(async () => {
    try {
      const transactionStats = { totalAmount: 0, pendingCount: 0, completedToday: 0, failedCount: 0 };
      setStats(transactionStats);
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
    calculateStats();
  }, [loadTransactions, calculateStats]);

  useEffect(() => {
    const unsubscribe = userService.onUsersUpdate(() => {
      loadTransactions();
      calculateStats();
    });
    return unsubscribe;
  }, [loadTransactions, calculateStats]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('en-US', { hour12: true });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit': return '💰';
      case 'withdrawal': return '💸';
      case 'trade': return '📈';
      default: return '💳';
    }
  };

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleApprove = async (transactionId: string) => {
    await userService.approveTransaction(transactionId);
    loadTransactions(); // refresh list
    calculateStats();
  };

  const handleReject = async (transactionId: string) => {
    const reason = window.prompt("Enter rejection reason:", "Rejected by admin");
    if (!reason || reason.trim() === "") {
      // Optionally show a warning here
      return;
    }

    try {
      await userService.rejectTransaction(transactionId, reason.trim());
      loadTransactions();
      calculateStats();
    } catch (error) {
      console.error("Failed to reject transaction:", error);
      alert("Failed to reject the transaction. Please try again.");
    }
  };


  const totalPages = Math.ceil(totalTransactions / pageSize);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    
    <div className="p-6">
            <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Transaction Management</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold">{stats.pendingCount}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed Today</p>
                <p className="text-2xl font-bold">{stats.completedToday}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Failed</p>
                <p className="text-2xl font-bold">{stats.failedCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* ...Filters and Table code unchanged */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({totalTransactions})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.id}</TableCell>
                  <TableCell>{transaction.userId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{getTypeIcon(transaction.type)}</span>
                      <span className="capitalize">{transaction.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">Actions</Button>
                      </DropdownMenuTrigger>
<DropdownMenuContent>
  <DropdownMenuItem asChild>
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">View Details</Button>
      </DialogTrigger>

      <div id="transaction-description" className="sr-only">
        View full details of this transaction and take actions such as approve or reject.
      </div>

      <DialogContent aria-describedby="transaction-description">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <p><strong>User ID:</strong> {transaction.userId}</p>
          <p><strong>Type:</strong> {transaction.type}</p>
          <p><strong>Amount:</strong> {formatCurrency(transaction.amount)}</p>
          <p><strong>Status:</strong> {transaction.status}</p>
          <p><strong>Description:</strong> {transaction.description}</p>
        </div>

        {transaction.status === 'pending' && (
          <DialogFooter className="flex gap-2 mt-4">
            <Button
              onClick={() => handleApprove(transaction.id)}
              // onClick={() => console.log('Approve', transaction.id)}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Approve
            </Button>
            <Button
              onClick={() => handleReject(transaction.id)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Reject
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  </DropdownMenuItem>

  {transaction.status === 'pending' && (
    <>
      <DropdownMenuItem onClick={() => handleApprove(transaction.id)}>Approve</DropdownMenuItem>
      <DropdownMenuItem onClick={() => handleReject(transaction.id)}>Reject</DropdownMenuItem>
    </>
  )}
</DropdownMenuContent>

                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {selectedTransaction && (
              <>
                <p><strong>ID:</strong> {selectedTransaction.id}</p>
                <p><strong>User ID:</strong> {selectedTransaction.userId}</p>
                <p><strong>Type:</strong> {selectedTransaction.type}</p>
                <p><strong>Amount:</strong> {formatCurrency(selectedTransaction.amount)}</p>
                <p><strong>Status:</strong> {selectedTransaction.status}</p>
                <p><strong>Description:</strong> {selectedTransaction.description}</p>
                <p><strong>Date:</strong> {formatDate(selectedTransaction.createdAt)}</p>
              </>
            )}
          </div>
          {selectedTransaction?.status === 'pending' && (
            <DialogFooter className="flex gap-2 mt-4">
              <Button
                onClick={() => handleApprove(selectedTransaction.id)}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                Approve
              </Button>
              <Button
                onClick={() => handleReject(selectedTransaction.id)}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Reject
              </Button>
            </DialogFooter>
          )}

        </DialogContent>
      </Dialog>
                {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, totalTransactions)} of {totalTransactions} transactions
            </p>
            <div className="flex items-center gap-2">
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
    </div>
    
  );
  
}
