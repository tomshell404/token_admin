"use client";

import { useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { userService, User } from '@/services/userService';

interface BalanceManagementModalProps {
  user: User;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function BalanceManagementModal({ user, open, onClose, onUpdate }: BalanceManagementModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBalanceAdjustment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!reason.trim()) {
      alert('Please provide a reason for this adjustment');
      return;
    }

    setIsProcessing(true);
    try {
      await userService.updateUserBalance(
        user.id,
        parseFloat(amount),
        adjustmentType,
        reason
      );

      onUpdate();
      setAmount('');
      setReason('');
      alert(`Balance ${adjustmentType === 'add' ? 'added' : 'deducted'} successfully`);
    } catch (error) {
      console.error('Error adjusting balance:', error);
      alert(error instanceof Error ? error.message : 'Error adjusting balance');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const presetReasons = [
    'Manual adjustment by admin',
    'Compensation for technical issue',
    'Bonus credit',
    'Correction of previous error',
    'Promotional credit',
    'Customer service gesture',
    'Account maintenance fee',
    'Penalty deduction',
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Balance Management - {user.fullName}</DialogTitle>
          <DialogDescription>
            Adjust user balance and manage financial records for {user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Balance Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Financial Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Balance:</span>
                    <span className="font-bold text-2xl text-green-600">
                      {formatCurrency(user.balance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Deposited:</span>
                    <span className="font-medium">{formatCurrency(user.totalDeposited)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Withdrawn:</span>
                    <span className="font-medium">{formatCurrency(user.totalWithdrawn)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Profit:</span>
                    <span className={`font-medium ${user.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(user.totalProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Status:</span>
                    <Badge className={user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {user.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Balance Adjustment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Balance Adjustment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Adjustment Type */}
              <div>
                <Label>Adjustment Type</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    variant={adjustmentType === 'add' ? 'default' : 'outline'}
                    onClick={() => setAdjustmentType('add')}
                    className={adjustmentType === 'add' ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    ➕ Add Funds
                  </Button>
                  <Button
                    variant={adjustmentType === 'subtract' ? 'default' : 'outline'}
                    onClick={() => setAdjustmentType('subtract')}
                    className={adjustmentType === 'subtract' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    ➖ Deduct Funds
                  </Button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <Label htmlFor="amount">
                  Amount (USD) - {adjustmentType === 'add' ? 'Add' : 'Deduct'}
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="mt-1"
                />
                {amount && (
                  <p className="text-sm text-gray-600 mt-1">
                    New balance will be: {formatCurrency(
                      user.balance + (adjustmentType === 'add' ? parseFloat(amount) || 0 : -(parseFloat(amount) || 0))
                    )}
                  </p>
                )}
              </div>

              {/* Reason */}
              <div>
                <Label htmlFor="reason">Reason for Adjustment</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide a detailed reason for this balance adjustment..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Preset Reasons */}
              <div>
                <Label>Quick Reasons</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {presetReasons.map((presetReason) => (
                    <Button
                      key={presetReason}
                      variant="outline"
                      size="sm"
                      onClick={() => setReason(presetReason)}
                      className="text-xs"
                    >
                      {presetReason}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Confirmation */}
              {amount && reason && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Confirmation</h4>
                  <p className="text-sm text-yellow-700">
                    You are about to <strong>{adjustmentType}</strong> <strong>{formatCurrency(parseFloat(amount))}</strong>
                    {adjustmentType === 'add' ? ' to' : ' from'} {user.fullName}'s account.
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    <strong>Reason:</strong> {reason}
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    <strong>New Balance:</strong> {formatCurrency(
                      user.balance + (adjustmentType === 'add' ? parseFloat(amount) : -parseFloat(amount))
                    )}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleBalanceAdjustment}
                  disabled={!amount || !reason || isProcessing}
                  className={`flex-1 ${
                    adjustmentType === 'add'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </div>
                  ) : (
                    `${adjustmentType === 'add' ? '➕ Add' : '➖ Deduct'} ${formatCurrency(parseFloat(amount) || 0)}`
                  )}
                </Button>
                <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Warning Notice */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">⚠️ Important Notice</h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Balance adjustments are irreversible and will be logged in the audit trail</li>
              <li>• All adjustments require a valid business reason and will be reviewed</li>
              <li>• Users will receive notifications about balance changes</li>
              <li>• Large adjustments may require additional approval</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
