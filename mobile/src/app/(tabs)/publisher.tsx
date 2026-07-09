import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, Platform, ActivityIndicator, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Camera, Image as ImageIcon, Smile, Calendar, Send, Sparkles, X, Loader2, CheckCircle2, Box } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { setContent, togglePlatform, setIsScheduling, resetPublisher } from '../../store/publisherSlice';
import { publisherService } from '../../api/publisherService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function Publisher() {
  const dispatch = useDispatch<any>();
  const { content, selectedPlatforms, isScheduling } = useSelector((state: any) => state.publisher);
  
  const [publishing, setPublishing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Request permissions
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
        await ImagePicker.requestCameraPermissionsAsync();
      }
    })();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        name: asset.fileName || asset.uri.split('/').pop(),
        type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
      });
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        name: asset.fileName || asset.uri.split('/').pop() || 'camera_capture.jpg',
        type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
      });
    }
  };

  const handlePublish = async () => {
    if (!content && !selectedFile) {
      Alert.alert('Error', 'Please add a caption or media.');
      return;
    }
    if (selectedPlatforms.length === 0) {
      Alert.alert('Error', 'Please select at least one platform.');
      return;
    }
    if (isScheduling && !scheduledAt) {
      Alert.alert('Error', 'Please select a schedule date and time.');
      return;
    }

    try {
      setPublishing(true);
      const formData = new FormData();
      formData.append('caption', content);
      formData.append('platforms', JSON.stringify(selectedPlatforms));
      
      if (selectedFile) {
        // Need to append the file in a way that React Native handles (multipart/form-data)
        formData.append('file', {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.type,
        } as any);
      }

      if (isScheduling && scheduledAt) {
        formData.append('scheduledAt', scheduledAt.toISOString());
        await publisherService.schedulePost(formData);
        Alert.alert('Success', 'Post scheduled successfully!');
      } else {
        const response = await publisherService.publishPost(formData);
        const results = response.results || [];
        const failed = results.filter((r: any) => !r.success);
        
        if (failed.length === 0) {
          Alert.alert('Success', 'Post published successfully!');
        } else if (failed.length === results.length) {
          Alert.alert('Error', `Failed to publish: ${failed[0].error}`);
        } else {
          Alert.alert('Warning', `Partial success. Failed on ${failed.map((f:any) => f.platform).join(', ')}`);
        }
      }
      
      dispatch(resetPublisher());
      setSelectedFile(null);
      setScheduledAt(null);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to process post.');
    } finally {
      setPublishing(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const current = scheduledAt || new Date();
      current.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setScheduledAt(new Date(current));
      if (Platform.OS === 'android') {
        setShowTimePicker(true);
      }
    }
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate && scheduledAt) {
      const current = new Date(scheduledAt);
      current.setHours(selectedDate.getHours(), selectedDate.getMinutes());
      setScheduledAt(current);
    }
  };

  const platforms = [
    { id: 'linkedin', name: 'LinkedIn', color: '#0077b5' },
    { id: 'facebook', name: 'Facebook', color: '#1877f2' },
    { id: 'instagram', name: 'Instagram', color: '#E1306C' },
    { id: 'twitter', name: 'X / Twitter', color: '#e2e8f0' },
  ];

  const charLimit = 2200;
  const charCount = content.length;

  return (
    <ScrollView className="flex-1 bg-background p-5 pb-10">
      <View className="mb-6">
        <Text className="text-3xl font-display font-bold tracking-tight text-on-surface">Publisher</Text>
        <Text className="text-on-surface-variant mt-1 text-sm">Compose and distribute content across platforms.</Text>
      </View>

      {/* Caption Section */}
      <View className="mb-6 flex-col gap-2">
        <View className="flex-row items-center justify-between ml-1">
          <Text className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Caption</Text>
          <Text className={`text-[10px] font-bold ${charCount > charLimit ? 'text-error' : 'text-[#4CAF50]'}`}>
            {charCount} / {charLimit}
          </Text>
        </View>

        <Card level="lowest" className={`p-0 overflow-hidden ${charCount > charLimit ? 'border-error/50' : 'border-ghost'}`}>
          <TextInput 
            value={content}
            onChangeText={(text) => dispatch(setContent(text))}
            placeholder="What's the story today?"
            placeholderTextColor="#6d758c"
            multiline
            style={{ minHeight: 120, textAlignVertical: 'top' }}
            className="w-full p-4 text-sm text-on-surface bg-transparent outline-none"
          />
        </Card>
      </View>

      {/* Media Upload Section */}
      <View className="mb-6 flex-col gap-2">
        <Text className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Media</Text>
        
        {selectedFile ? (
          <Card level="high" className="p-0 overflow-hidden relative">
            <Image source={{ uri: selectedFile.uri }} className="w-full h-[200px]" resizeMode="contain" />
            <TouchableOpacity 
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-error flex items-center justify-center shadow-lg"
              onPress={() => setSelectedFile(null)}
            >
              <X color="white" size={16} />
            </TouchableOpacity>
          </Card>
        ) : (
          <View className="flex-row gap-4">
            <TouchableOpacity 
              className="flex-1 p-6 rounded-2xl bg-surface-container-low border border-ghost border-dashed items-center justify-center"
              onPress={pickImage}
            >
              <ImageIcon color="#bd9dff" size={24} className="mb-2" />
              <Text className="text-xs font-bold text-on-surface">Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="flex-1 p-6 rounded-2xl bg-surface-container-low border border-ghost border-dashed items-center justify-center"
              onPress={takePhoto}
            >
              <Camera color="#bd9dff" size={24} className="mb-2" />
              <Text className="text-xs font-bold text-on-surface">Camera</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Target Platforms */}
      <View className="mb-6 flex-col gap-2">
        <Text className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Target Platforms</Text>
        <View className="flex-row flex-wrap gap-3">
          {platforms.map(platform => {
            const isActive = selectedPlatforms.includes(platform.id);
            return (
              <TouchableOpacity 
                key={platform.id}
                onPress={() => dispatch(togglePlatform(platform.id))}
                style={{ width: '47%' }}
                className={`p-4 rounded-xl border flex-row items-center gap-3 ${isActive ? 'bg-primary/10 border-primary' : 'bg-surface-container-low border-ghost'}`}
              >
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: platform.color }} />
                <Text className={`text-xs font-bold ${isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>{platform.name}</Text>
                {isActive && <CheckCircle2 color="#bd9dff" size={14} className="ml-auto" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-col gap-4 pb-12">
        {isScheduling && (
          <Card level="lowest" className="p-4 border border-primary/20 bg-surface-container">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Schedule Time</Text>
            <TouchableOpacity 
              className="py-3 px-4 rounded-xl bg-background border border-ghost mb-2"
              onPress={() => setShowDatePicker(true)}
            >
              <Text className="text-sm text-on-surface">
                {scheduledAt ? scheduledAt.toLocaleDateString() : 'Select Date'}
              </Text>
            </TouchableOpacity>
            
            {Platform.OS === 'ios' && showDatePicker && (
              <DateTimePicker
                value={scheduledAt || new Date()}
                mode="datetime"
                display="spinner"
                onChange={onDateChange}
              />
            )}
            
            {Platform.OS === 'android' && showDatePicker && (
              <DateTimePicker
                value={scheduledAt || new Date()}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}
            {Platform.OS === 'android' && showTimePicker && (
              <DateTimePicker
                value={scheduledAt || new Date()}
                mode="time"
                display="default"
                onChange={onTimeChange}
              />
            )}
          </Card>
        )}

        <View className="flex-row gap-4">
          <Button 
            variant={isScheduling ? 'secondary' : 'surface'}
            className="flex-1"
            title={isScheduling ? 'Cancel' : 'Schedule'}
            icon={<Calendar color={isScheduling ? '#bd9dff' : '#a3aac4'} size={16} />}
            onPress={() => dispatch(setIsScheduling(!isScheduling))}
          />
          <Button 
            className="flex-[2]"
            title={publishing ? 'Processing...' : (isScheduling ? 'Confirm Schedule' : 'Publish Now')}
            icon={publishing ? <ActivityIndicator size="small" color="#1a0044" /> : <Send color="#1a0044" size={16} />}
            onPress={handlePublish}
            disabled={publishing || charCount > charLimit}
          />
        </View>
      </View>
    </ScrollView>
  );
}
