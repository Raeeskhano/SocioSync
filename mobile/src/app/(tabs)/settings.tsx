import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Key, Database, Monitor, Camera, ShieldCheck, Plus, Trash2, Copy, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';

import { fetchProfile, saveProfile, uploadAvatar, fetchSession, fetchApiKeys, generateApiKey, revokeApiKey, clearNewKey } from '../../store/settingsSlice';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const API_BASE = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://10.0.2.2:5000';

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
];

export default function Settings() {
  const dispatch = useDispatch<any>();
  const { profile, usage, session, apiKeys, newlyGeneratedKey, loading, saving } = useSelector((state: any) => state.settings);
  
  const [activeTab, setActiveTab] = useState('edit');
  const [form, setForm] = useState({ firstName: '', lastName: '', bio: '', timezone: '', statusBadge: '' });
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);

  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchSession());
  }, []);

  useEffect(() => {
    if (activeTab === 'api') dispatch(fetchApiKeys());
  }, [activeTab]);

  useEffect(() => {
    if (profile.firstName || profile.lastName) {
      setForm({
        firstName: profile.firstName,
        lastName: profile.lastName,
        bio: profile.bio,
        timezone: profile.timezone,
        statusBadge: profile.statusBadge || ''
      });
    }
  }, [profile.firstName, profile.lastName, profile.bio, profile.timezone, profile.statusBadge]);

  useEffect(() => {
    if (newlyGeneratedKey) {
      Alert.alert(
        'New API Key Generated',
        `${newlyGeneratedKey.message}\n\nKey: ${newlyGeneratedKey.fullKey}`,
        [
          { text: 'Copy Key', onPress: async () => {
            await Clipboard.setStringAsync(newlyGeneratedKey.fullKey);
            dispatch(clearNewKey());
          } },
          { text: 'OK', onPress: () => dispatch(clearNewKey()) }
        ]
      );
    }
  }, [newlyGeneratedKey]);

  const handleSave = async () => {
    try {
      await dispatch(saveProfile(form)).unwrap();
      Alert.alert('Success', 'Profile saved successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to save profile.');
    }
  };

  const handleAvatarChange = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      try {
        const file = {
          uri: asset.uri,
          name: asset.fileName || 'avatar.jpg',
          type: 'image/jpeg',
        } as any;
        await dispatch(uploadAvatar(file)).unwrap();
        Alert.alert('Success', 'Avatar updated!');
      } catch (err) {
        Alert.alert('Error', 'Failed to upload avatar.');
      }
    }
  };

  const handleGenerateKey = () => {
    if (!newKeyName.trim()) return;
    dispatch(generateApiKey(newKeyName.trim()));
    setNewKeyName('');
    setShowNewKeyDialog(false);
  };

  const avatarSrc = profile.avatarUrl
    ? (profile.avatarUrl.startsWith('http') ? profile.avatarUrl : `${API_BASE}${profile.avatarUrl}`)
    : `https://ui-avatars.com/api/?name=${profile.firstName}+${profile.lastName}&background=7c3aed&color=fff&size=150`;

  if (loading && !profile.email) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#bd9dff" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background p-5 pb-10">
      <View className="mb-6">
        <Text className="text-3xl font-display font-bold tracking-tight text-on-surface">Settings</Text>
        <Text className="text-on-surface-variant text-sm mt-1">Manage your account and preferences.</Text>
      </View>

      <View className="flex-row p-1 bg-surface-container rounded-2xl mb-6">
        <Button 
          variant={activeTab === 'edit' ? 'primary' : 'tertiary'} 
          className="flex-1"
          onPress={() => setActiveTab('edit')}
        >
          Edit Profile
        </Button>
        <Button 
          variant={activeTab === 'api' ? 'primary' : 'tertiary'} 
          className="flex-1"
          onPress={() => setActiveTab('api')}
        >
          API Keys
        </Button>
      </View>

      {activeTab === 'edit' && (
        <View className="flex-col gap-6">
          <Card level="high">
            <View className="flex-row items-center gap-6 mb-6">
              <View className="relative">
                <Image source={{ uri: avatarSrc }} className="w-20 h-20 rounded-2xl" />
                <TouchableOpacity 
                  onPress={handleAvatarChange}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-xl flex items-center justify-center border-2 border-surface-container"
                >
                  <Camera color="white" size={14} />
                </TouchableOpacity>
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-on-surface">{profile.firstName} {profile.lastName}</Text>
                <Text className="text-xs text-on-surface-variant mt-1">{profile.email}</Text>
                <View className="bg-primary/20 self-start px-2 py-0.5 rounded-md mt-2">
                  <Text className="text-[10px] font-bold uppercase tracking-widest text-primary">{profile.plan} plan</Text>
                </View>
              </View>
            </View>

            <View className="flex-col gap-4 mb-4">
              <View className="flex-row gap-4">
                <View className="flex-1 flex-col gap-2">
                  <Text className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">First Name</Text>
                  <TextInput 
                    value={form.firstName}
                    onChangeText={text => setForm({...form, firstName: text})}
                    className="bg-surface-container-low border border-ghost rounded-xl p-4 text-sm text-on-surface"
                  />
                </View>
                <View className="flex-1 flex-col gap-2">
                  <Text className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Last Name</Text>
                  <TextInput 
                    value={form.lastName}
                    onChangeText={text => setForm({...form, lastName: text})}
                    className="bg-surface-container-low border border-ghost rounded-xl p-4 text-sm text-on-surface"
                  />
                </View>
              </View>
              <View className="flex-col gap-2">
                <Text className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Bio</Text>
                <TextInput 
                  value={form.bio}
                  onChangeText={text => setForm({...form, bio: text})}
                  multiline
                  style={{ minHeight: 80, textAlignVertical: 'top' }}
                  className="bg-surface-container-low border border-ghost rounded-xl p-4 text-sm text-on-surface"
                />
              </View>
            </View>
            
            <Button 
              onPress={handleSave} 
              disabled={saving}
              className="mt-4"
              icon={saving ? <ActivityIndicator size="small" color="#1a0044" /> : undefined}
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </Card>

          <Card level="high">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4">Current Session</Text>
            <View className="flex-row items-center gap-4 p-4 rounded-xl bg-surface-container-low border border-ghost">
              <Monitor color="#bd9dff" size={24} />
              <View className="flex-1">
                <Text className="text-sm font-bold text-on-surface">{session.browser || 'Loading...'} on {session.os || '...'}</Text>
                <Text className="text-[10px] text-on-surface-variant mt-1">IP: {session.ip || '...'} • Active Now</Text>
              </View>
            </View>
          </Card>
        </View>
      )}

      {activeTab === 'api' && (
        <View className="flex-col gap-6">
          <Card level="high">
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center gap-4">
                <View className="w-12 h-12 rounded-xl bg-primary/20 items-center justify-center">
                  <Key color="#bd9dff" size={24} />
                </View>
                <View>
                  <Text className="text-xl font-bold text-on-surface">API Keys</Text>
                </View>
              </View>
            </View>

            {showNewKeyDialog ? (
              <View className="mb-6 p-4 bg-surface-container-low rounded-xl border border-ghost">
                <Text className="text-xs font-bold text-on-surface mb-2">Name Your Key</Text>
                <TextInput
                  value={newKeyName}
                  onChangeText={setNewKeyName}
                  placeholder="e.g. Mobile App"
                  placeholderTextColor="#6d758c"
                  className="bg-surface-container border border-ghost rounded-xl p-3 text-sm text-on-surface mb-3"
                />
                <View className="flex-row gap-2">
                  <Button variant="secondary" className="flex-1 py-2" onPress={() => setShowNewKeyDialog(false)}>Cancel</Button>
                  <Button className="flex-1 py-2" onPress={handleGenerateKey}>Generate</Button>
                </View>
              </View>
            ) : (
              <Button 
                variant="surface" 
                className="mb-6"
                icon={<Plus color="#bd9dff" size={16} />}
                onPress={() => setShowNewKeyDialog(true)}
              >
                Generate New Key
              </Button>
            )}

            <View className="flex-col gap-3">
              {apiKeys.length === 0 && (
                <Text className="text-center py-4 text-on-surface-variant text-sm italic">No API keys yet.</Text>
              )}
              {apiKeys.map((item: any) => (
                <View key={item.id} className="flex-row items-center justify-between p-4 rounded-xl bg-surface-container-low border border-ghost">
                  <View className="flex-row items-center gap-3">
                    <ShieldCheck color="#6d758c" size={20} />
                    <View className="flex-col">
                      <Text className="text-sm font-bold text-on-surface">{item.name}</Text>
                      <Text className="text-[10px] text-on-surface-variant font-mono">{item.keyPrefix}••••••••••••</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    className="p-2"
                    onPress={() => dispatch(revokeApiKey(item.id))}
                  >
                    <Trash2 color="#ff6e84" size={16} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </Card>
        </View>
      )}
    </ScrollView>
  );
}
