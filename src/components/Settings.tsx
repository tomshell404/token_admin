"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdmin } from './AdminProvider';

export default function Settings() {
  const { currentAdmin, updateAdminStatus } = useAdmin();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    platform: {
      maintenanceMode: false,
      registrationEnabled: true,
      kycRequired: true,
      withdrawalEnabled: true,
      depositEnabled: true,
      tradingEnabled: true,
      autoKycApproval: false,
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      slackIntegration: false,
    },
    security: {
      twoFactorRequired: true,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      passwordExpiry: 90,
      ipWhitelist: '',
    },
    trading: {
      minDeposit: 10,
      maxDeposit: 50000,
      minWithdrawal: 10,
      maxWithdrawal: 25000,
      tradingFee: 0.25,
      withdrawalFee: 2.5,
    },
    api: {
      rateLimit: 100,
      apiKeysEnabled: true,
      webhooksEnabled: true,
      corsEnabled: true,
    }
  });

  const handleSaveSettings = async (section: string) => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(`${section} settings saved successfully!`);
    } catch (error) {
      alert('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSystemAction = async (action: string) => {
    const confirmed = confirm(`Are you sure you want to ${action}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      // Simulate system action
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`${action} completed successfully!`);
    } catch (error) {
      alert(`Error performing ${action}. Please try again.`);
    }
  };

  const handleExportData = (type: string) => {
    // Simulate data export
    const data = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
    alert(`${type} data export initiated. File: ${data}`);
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <p className="text-gray-600">Configure platform settings and preferences</p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="platform" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="platform">Platform</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="trading">Trading</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Configuration</CardTitle>
              <p className="text-gray-600">Control core platform features and access</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenance">Maintenance Mode</Label>
                      <p className="text-sm text-gray-500">Disable user access for maintenance</p>
                    </div>
                    <Switch
                      id="maintenance"
                      checked={settings.platform.maintenanceMode}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          platform: { ...settings.platform, maintenanceMode: checked }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="registration">User Registration</Label>
                      <p className="text-sm text-gray-500">Allow new user registrations</p>
                    </div>
                    <Switch
                      id="registration"
                      checked={settings.platform.registrationEnabled}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          platform: { ...settings.platform, registrationEnabled: checked }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="kyc">KYC Required</Label>
                      <p className="text-sm text-gray-500">Require KYC for all users</p>
                    </div>
                    <Switch
                      id="kyc"
                      checked={settings.platform.kycRequired}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          platform: { ...settings.platform, kycRequired: checked }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autokyc">Auto KYC Approval</Label>
                      <p className="text-sm text-gray-500">Automatically approve simple KYC</p>
                    </div>
                    <Switch
                      id="autokyc"
                      checked={settings.platform.autoKycApproval}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          platform: { ...settings.platform, autoKycApproval: checked }
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="trading">Trading Enabled</Label>
                      <p className="text-sm text-gray-500">Allow users to trade</p>
                    </div>
                    <Switch
                      id="trading"
                      checked={settings.platform.tradingEnabled}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          platform: { ...settings.platform, tradingEnabled: checked }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="deposits">Deposits Enabled</Label>
                      <p className="text-sm text-gray-500">Allow user deposits</p>
                    </div>
                    <Switch
                      id="deposits"
                      checked={settings.platform.depositEnabled}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          platform: { ...settings.platform, depositEnabled: checked }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="withdrawals">Withdrawals Enabled</Label>
                      <p className="text-sm text-gray-500">Allow user withdrawals</p>
                    </div>
                    <Switch
                      id="withdrawals"
                      checked={settings.platform.withdrawalEnabled}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          platform: { ...settings.platform, withdrawalEnabled: checked }
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Button onClick={() => handleSaveSettings('Platform')} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Platform Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Configuration</CardTitle>
              <p className="text-gray-600">Manage security policies and access controls</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          security: { ...settings.security, sessionTimeout: parseInt(e.target.value) }
                        })
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxAttempts"
                      type="number"
                      value={settings.security.maxLoginAttempts}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          security: { ...settings.security, maxLoginAttempts: parseInt(e.target.value) }
                        })
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                    <Input
                      id="passwordExpiry"
                      type="number"
                      value={settings.security.passwordExpiry}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          security: { ...settings.security, passwordExpiry: parseInt(e.target.value) }
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="twoFactor">Require 2FA</Label>
                      <p className="text-sm text-gray-500">Force 2FA for all admins</p>
                    </div>
                    <Switch
                      id="twoFactor"
                      checked={settings.security.twoFactorRequired}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          security: { ...settings.security, twoFactorRequired: checked }
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="ipWhitelist">IP Whitelist</Label>
                    <Textarea
                      id="ipWhitelist"
                      value={settings.security.ipWhitelist}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          security: { ...settings.security, ipWhitelist: e.target.value }
                        })
                      }
                      placeholder="Enter IP addresses, one per line"
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={() => handleSaveSettings('Security')} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Security Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trading" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trading Configuration</CardTitle>
              <p className="text-gray-600">Set trading limits and fees</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Deposit Limits</h4>
                  <div>
                    <Label htmlFor="minDeposit">Minimum Deposit ($)</Label>
                    <Input
                      id="minDeposit"
                      type="number"
                      value={settings.trading.minDeposit}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          trading: { ...settings.trading, minDeposit: parseInt(e.target.value) }
                        })
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxDeposit">Maximum Deposit ($)</Label>
                    <Input
                      id="maxDeposit"
                      type="number"
                      value={settings.trading.maxDeposit}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          trading: { ...settings.trading, maxDeposit: parseInt(e.target.value) }
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Withdrawal Limits</h4>
                  <div>
                    <Label htmlFor="minWithdrawal">Minimum Withdrawal ($)</Label>
                    <Input
                      id="minWithdrawal"
                      type="number"
                      value={settings.trading.minWithdrawal}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          trading: { ...settings.trading, minWithdrawal: parseInt(e.target.value) }
                        })
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxWithdrawal">Maximum Withdrawal ($)</Label>
                    <Input
                      id="maxWithdrawal"
                      type="number"
                      value={settings.trading.maxWithdrawal}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          trading: { ...settings.trading, maxWithdrawal: parseInt(e.target.value) }
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="tradingFee">Trading Fee (%)</Label>
                  <Input
                    id="tradingFee"
                    type="number"
                    step="0.01"
                    value={settings.trading.tradingFee}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        trading: { ...settings.trading, tradingFee: parseFloat(e.target.value) }
                      })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="withdrawalFee">Withdrawal Fee ($)</Label>
                  <Input
                    id="withdrawalFee"
                    type="number"
                    step="0.01"
                    value={settings.trading.withdrawalFee}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        trading: { ...settings.trading, withdrawalFee: parseFloat(e.target.value) }
                      })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <Button onClick={() => handleSaveSettings('Trading')} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Trading Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <p className="text-gray-600">Configure notification channels and preferences</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">Send email alerts for important events</p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, emailNotifications: checked }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-gray-500">Send SMS alerts for critical events</p>
                  </div>
                  <Switch
                    checked={settings.notifications.smsNotifications}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, smsNotifications: checked }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-500">Browser push notifications</p>
                  </div>
                  <Switch
                    checked={settings.notifications.pushNotifications}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, pushNotifications: checked }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Slack Integration</Label>
                    <p className="text-sm text-gray-500">Send alerts to Slack channels</p>
                  </div>
                  <Switch
                    checked={settings.notifications.slackIntegration}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, slackIntegration: checked }
                      })
                    }
                  />
                </div>
              </div>

              <Button onClick={() => handleSaveSettings('Notifications')} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Notification Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <p className="text-gray-600">Manage API access and settings</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="rateLimit">Rate Limit (requests/minute)</Label>
                    <Input
                      id="rateLimit"
                      type="number"
                      value={settings.api.rateLimit}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          api: { ...settings.api, rateLimit: parseInt(e.target.value) }
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>API Keys Enabled</Label>
                      <p className="text-sm text-gray-500">Allow users to create API keys</p>
                    </div>
                    <Switch
                      checked={settings.api.apiKeysEnabled}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          api: { ...settings.api, apiKeysEnabled: checked }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Webhooks Enabled</Label>
                      <p className="text-sm text-gray-500">Allow webhook subscriptions</p>
                    </div>
                    <Switch
                      checked={settings.api.webhooksEnabled}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          api: { ...settings.api, webhooksEnabled: checked }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>CORS Enabled</Label>
                      <p className="text-sm text-gray-500">Enable cross-origin requests</p>
                    </div>
                    <Switch
                      checked={settings.api.corsEnabled}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          api: { ...settings.api, corsEnabled: checked }
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Button onClick={() => handleSaveSettings('API')} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save API Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Administration</CardTitle>
              <p className="text-gray-600">System maintenance and data management</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">System Status</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">System Uptime</span>
                      <Badge className="bg-green-100 text-green-800">99.8%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Database Status</span>
                      <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cache Status</span>
                      <Badge className="bg-green-100 text-green-800">Optimal</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">API Status</span>
                      <Badge className="bg-green-100 text-green-800">Online</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={() => handleSystemAction('Clear Cache')}
                      variant="outline"
                      className="w-full"
                    >
                      🔄 Clear Cache
                    </Button>
                    <Button
                      onClick={() => handleSystemAction('Restart Services')}
                      variant="outline"
                      className="w-full"
                    >
                      🔄 Restart Services
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Data Management</h4>
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleExportData('Users')}
                      variant="outline"
                      className="w-full"
                    >
                      📊 Export User Data
                    </Button>
                    <Button
                      onClick={() => handleExportData('Transactions')}
                      variant="outline"
                      className="w-full"
                    >
                      📊 Export Transaction Data
                    </Button>
                    <Button
                      onClick={() => handleExportData('Chat Logs')}
                      variant="outline"
                      className="w-full"
                    >
                      📊 Export Chat Logs
                    </Button>
                    <Button
                      onClick={() => handleExportData('Audit Logs')}
                      variant="outline"
                      className="w-full"
                    >
                      📊 Export Audit Logs
                    </Button>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-red-600 mb-2">Danger Zone</h4>
                    <Button
                      onClick={() => handleSystemAction('Database Backup')}
                      variant="outline"
                      className="w-full mb-2"
                    >
                      💾 Create Database Backup
                    </Button>
                    <Button
                      onClick={() => handleSystemAction('Full System Reset')}
                      variant="outline"
                      className="w-full text-red-600 border-red-300 hover:bg-red-50"
                    >
                      ⚠️ Full System Reset
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
