import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Globe, ShieldCheck, CheckCircle2, ShieldAlert, X, Zap } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';

import { fetchIntegrations, reconnectIntegration, disconnectIntegration } from '../../store/integrationsSlice';
import integrationService from '../../api/integrationService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const API_BASE = 'https://socio-sync-pi.vercel.app';

const PlatformConfig: any = {
  linkedin: { name: 'LinkedIn', color: '#0A66C2' },
  instagram: { name: 'Instagram', color: '#E4405F' },
  facebook: { name: 'Facebook', color: '#1877F2' },
  twitter: { name: 'X / Twitter', color: '#000000' }
};

export default function Integrations() {
  const dispatch = useDispatch<any>();
  const { connectedAccounts, upcomingPlatforms, loading } = useSelector((state: any) => state.integrations);
  
  const [refreshing, setRefreshing] = useState(false);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const unconnectedPlatforms = Object.keys(PlatformConfig).filter(
    (platformKey) => !connectedAccounts.some((acc: any) => acc.platform.toLowerCase() === platformKey)
  );

  useEffect(() => {
    dispatch(fetchIntegrations());
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchIntegrations());
    setRefreshing(false);
  };

  const handleConnect = async (platform: string) => {
    try {
      const { url } = await integrationService.getAuthUrl(platform);
      
      const result = await WebBrowser.openAuthSessionAsync(
        url,
        'sociosync://'
      );
      
      if (result.type === 'success') {
        Alert.alert('Success', `Successfully connected ${platform}!`);
        dispatch(fetchIntegrations());
      }
    } catch (err: any) {
      Alert.alert('Error', `Failed to connect ${platform}`);
    }
  };

  const handleDisconnect = (platform: string) => {
    Alert.alert(
      'Disconnect',
      `Are you sure you want to disconnect ${platform}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: () => dispatch(disconnectIntegration(platform)) }
      ]
    );
  };

  const handleOpenLogs = async () => {
    setShowLogsModal(true);
    setLoadingLogs(true);
    try {
      const logs = await integrationService.getSecurityLogs();
      setSecurityLogs(logs || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  if (loading && connectedAccounts.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#bd9dff" />
        <Text className="text-on-surface-variant font-medium mt-4">Syncing integrations...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView 
        className="flex-1 bg-background"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#bd9dff" />}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        <View className="mb-6">
          <Text className="text-3xl font-display font-bold tracking-tight text-on-surface">Connections</Text>
          <Text className="text-on-surface-variant mt-1 text-sm">Manage your social ecosystem.</Text>
        </View>

        {connectedAccounts.length > 0 && (
          <View className="flex-col gap-4 mb-6">
            {connectedAccounts.map((account: any) => {
              const config = PlatformConfig[account.platform.toLowerCase()] || { name: account.platform, color: '#bd9dff' };
              
              return (
                <Card key={account.platform} level="high">
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-row items-center gap-3">
                      <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: config.color + '20' }}>
                        <Globe color={config.color} size={20} />
                      </View>
                      <View className="flex-col">
                        <Text className="font-display font-bold text-base text-on-surface">{config.name}</Text>
                        <Text className="text-xs text-on-surface-variant">{account.accountHandle || 'Connected'}</Text>
                      </View>
                    </View>
                    <View className={`flex-row items-center gap-1.5 px-2 py-0.5 rounded-full ${account.status === 'connected' ? 'bg-success/10' : 'bg-error/10'}`}>
                      <View className={`w-1.5 h-1.5 rounded-full ${account.status === 'connected' ? 'bg-success' : 'bg-error'}`} />
                      <Text className={`text-[9px] font-bold uppercase tracking-wider ${account.status === 'connected' ? 'text-success' : 'text-error'}`}>
                        {account.status}
                      </Text>
                    </View>
                  </View>

                  {account.status === 'error' && (
                    <View className="p-3 rounded-xl bg-error/10 border border-error/20 mb-4">
                      <Text className="text-[10px] text-error font-medium">{account.errorMessage || 'Connection lost. Please reconnect.'}</Text>
                    </View>
                  )}

                  <View className="flex-row items-center justify-between pt-2">
                    {account.status === 'error' ? (
                      <Button variant="secondary" className="flex-1 py-2" onPress={() => handleConnect(account.platform)}>
                        <View className="flex-row items-center gap-2">
                          <ShieldAlert color="#bd9dff" size={14} />
                          <Text className="text-[10px] uppercase font-bold text-primary tracking-widest">Reconnect</Text>
                        </View>
                      </Button>
                    ) : (
                      <>
                        <View className="flex-row items-center gap-2">
                          <CheckCircle2 color="#4CAF50" size={14} />
                          <Text className="text-[10px] text-success font-bold uppercase tracking-widest">Operational</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDisconnect(account.platform)}>
                          <Text className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Disconnect</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {unconnectedPlatforms.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-display font-bold text-on-surface mb-1">Available Integrations</Text>
            <Text className="text-xs text-on-surface-variant mb-4">Select a channel to link it to SocioSync.</Text>
            
            <View className="flex-row flex-wrap gap-4">
              {unconnectedPlatforms.map((platformKey) => {
                const config = PlatformConfig[platformKey];
                return (
                  <TouchableOpacity 
                    key={platformKey}
                    onPress={() => handleConnect(platformKey)}
                    style={{ width: '47%' }}
                    className="p-4 rounded-[1.5rem] bg-surface-container-low border border-ghost border-dashed flex-col items-center gap-3"
                  >
                    <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: config.color + '20' }}>
                      <Globe color={config.color} size={20} />
                    </View>
                    <Text className="text-sm font-bold text-on-surface text-center">{config.name}</Text>
                    <View className="bg-primary/10 px-2.5 py-1 rounded-full">
                      <Text className="text-[9px] font-bold text-primary uppercase tracking-widest">Link</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <Card level="high" className="flex-col gap-4 items-center text-center mt-4">
          <ShieldCheck color="#bd9dff" size={32} className="mb-2" />
          <Text className="font-display font-bold text-lg text-on-surface text-center">Enterprise Security</Text>
          <Text className="text-xs text-on-surface-variant text-center mb-2">
            SocioSync uses OAuth 2.0 and AES-256 encryption. We never store raw passwords.
          </Text>
          <Button variant="secondary" className="w-full" onPress={handleOpenLogs}>
            Audit Security Logs
          </Button>
        </Card>
      </ScrollView>

      {showLogsModal && (
        <View className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <View className="bg-surface-container-high w-full max-h-[80%] rounded-[2rem] p-6 flex-col">
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center gap-3">
                <ShieldCheck color="#bd9dff" size={24} />
                <Text className="text-lg font-bold text-on-surface">Security Logs</Text>
              </View>
              <TouchableOpacity onPress={() => setShowLogsModal(false)}>
                <X color="#6d758c" size={24} />
              </TouchableOpacity>
            </View>
            
            <ScrollView className="flex-1">
              {loadingLogs ? (
                <ActivityIndicator size="large" color="#bd9dff" className="mt-10" />
              ) : securityLogs.length === 0 ? (
                <Text className="text-center text-on-surface-variant py-10">No security events logged.</Text>
              ) : (
                securityLogs.map(log => (
                  <View key={log._id} className="p-4 rounded-xl bg-surface-container border border-ghost mb-3 flex-row items-start gap-3">
                    <View className={`w-8 h-8 rounded-lg items-center justify-center ${
                      log.event === 'connected' ? 'bg-success/10' : 'bg-error/10'
                    }`}>
                      <Zap color={log.event === 'connected' ? '#4CAF50' : '#ff6e84'} size={14} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-xs font-bold text-on-surface capitalize">Account {log.event}</Text>
                        <Text className="text-[10px] text-on-surface-variant">{new Date(log.timestamp).toLocaleDateString()}</Text>
                      </View>
                      <Text className="text-[10px] text-on-surface-variant">Platform: {log.platform}</Text>
                      {log.errorMessage && <Text className="text-[10px] text-error mt-1">{log.errorMessage}</Text>}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </>
  );
}
