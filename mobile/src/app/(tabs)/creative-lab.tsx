import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { FileEdit, Image as ImageIcon, Wand2, Hand, Briefcase, Trophy, Sparkles, Copy, Download, Type } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

import aiService from '../../api/aiService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const POLLINATIONS_LOADING_MESSAGES = [
  'Crafting your image with Pollinations AI...',
  'Generating fast, high-quality results...',
  'Almost ready ✨',
];

export default function CreativeLab() {
  const [textPrompt, setTextPrompt] = useState('');
  const [imagePrompt, setImagePrompt] = useState('A futuristic storefront for a green sustainable brand, highly detailed, cinematic lighting');
  const [selectedTone, setSelectedTone] = useState('Humanized');
  const [textOutput, setTextOutput] = useState('');
  const [imageOutputs, setImageOutputs] = useState<string[]>([]);
  const [recentCreations, setRecentCreations] = useState<any[]>([]);
  
  const [generatingText, setGeneratingText] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);

  const tones = [
    { name: 'Humanized', id: 'humanized', icon: Hand },
    { name: 'Professional', id: 'professional', icon: Briefcase },
    { name: 'Casual', id: 'casual', icon: Trophy },
  ];

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (!generatingImages) return;
    setLoadingMessageIdx(0);
    const interval = setInterval(() => {
      setLoadingMessageIdx(prev => (prev + 1) % POLLINATIONS_LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [generatingImages]);

  const fetchHistory = async () => {
    try {
      const history = await aiService.getRecentCreations(10);
      setRecentCreations(history);
    } catch (err) {
      // ignore
    }
  };

  const handleGenerateCopy = async () => {
    if (!textPrompt) return;
    try {
      setGeneratingText(true);
      const toneId = tones.find(t => t.name === selectedTone)?.id || 'humanized';
      const result = await aiService.generateCopy(textPrompt, toneId);
      // result is the data object: { generatedText, creationId }
      const generated = result?.generatedText || result;
      setTextOutput(typeof generated === 'string' ? generated : JSON.stringify(generated));
      fetchHistory();
    } catch (err: any) {
      console.error('Generate Copy Error:', err.response?.data || err.message);
      Alert.alert('AI Error', err.response?.data?.message || err.message || 'Failed to generate copy. Check your API key.');
    } finally {
      setGeneratingText(false);
    }
  };

  const handleGenerateImages = async () => {
    if (!imagePrompt) return;
    try {
      setGeneratingImages(true);

      // Step 1: Get Gemini-enhanced prompt from backend (optional)
      let enhancedPrompt = imagePrompt;
      try {
        const config = await aiService.generateImages(imagePrompt);
        if (config && config.enhancedPrompt) {
          enhancedPrompt = config.enhancedPrompt;
        }
      } catch (enhanceErr) {
        console.warn('[Image Gen] Prompt enhancement failed, using original:', enhanceErr);
      }

      // Step 2: Build Pollinations URL and set it — React Native <Image> will load it directly
      const seed = Math.floor(Math.random() * 1000000);
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=768&height=768&nologo=true&enhance=true&seed=${seed}`;
      
      console.log('[Image Gen] Pollinations URL:', pollinationsUrl);
      setImageOutputs([pollinationsUrl]);

      // Step 3: Save to history in background
      try {
        await aiService.saveImageCreation(imagePrompt, [pollinationsUrl]);
        fetchHistory();
      } catch (saveErr) {
        console.warn('[Image Gen] Save failed (non-critical):', saveErr);
      }

    } catch (err: any) {
      console.error('Generate Images Error:', err.response?.data || err.message);
      Alert.alert('Image Error', err.response?.data?.message || err.message || 'Failed to generate image.');
    } finally {
      setGeneratingImages(false);
    }
  };

  const handleCopy = async () => {
    if (!textOutput) return;
    await Clipboard.setStringAsync(textOutput);
    Alert.alert('Success', 'Copied to clipboard!');
  };

  const handleDownload = async () => {
    if (!imageOutputs || imageOutputs.length === 0) return;
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant media permissions to save images.');
        return;
      }

      const imageUrl = imageOutputs[0];
      const fileUri = FileSystem.documentDirectory + 'SocioSync_Masterpiece.jpg';
      const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Success', 'Image saved to gallery!');
    } catch (err) {
      Alert.alert('Error', 'Failed to save image.');
    }
  };

  return (
    <ScrollView className="flex-1 bg-background p-5 pb-10">
      <View className="mb-6 flex-row justify-between items-center">
        <View className="flex-col gap-1">
          <Text className="text-3xl font-display font-bold tracking-tight text-on-surface">AI Lab</Text>
          <Text className="text-on-surface-variant text-sm">Harness the power of AI.</Text>
        </View>
        <View className="flex-row items-center gap-2 bg-surface-container-highest px-3 py-1.5 rounded-full">
          <View className="w-2 h-2 rounded-full bg-primary" />
          <Text className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Pollinations AI</Text>
        </View>
      </View>

      <Card level="high" className="mb-6">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <FileEdit color="#bd9dff" size={20} />
            </View>
            <Text className="font-display font-bold text-lg text-on-surface">Text Generator</Text>
          </View>
        </View>

        <View className="flex-col gap-2 mb-4">
          <Text className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Prompt</Text>
          <TextInput
            value={textPrompt}
            onChangeText={setTextPrompt}
            placeholder="e.g., Write a catchy caption for..."
            placeholderTextColor="#6d758c"
            multiline
            style={{ minHeight: 100, textAlignVertical: 'top' }}
            className="w-full bg-surface-container-low border border-ghost rounded-2xl p-4 text-sm text-on-surface"
          />
        </View>

        <View className="flex-col gap-2 mb-4">
          <Text className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Tone</Text>
          <View className="flex-row justify-between">
            {tones.map(tone => {
              const Icon = tone.icon;
              const isSelected = selectedTone === tone.name;
              return (
                <TouchableOpacity 
                  key={tone.name}
                  onPress={() => setSelectedTone(tone.name)}
                  className={`flex-1 items-center py-3 mx-1 rounded-2xl border ${isSelected ? 'bg-primary/10 border-primary' : 'bg-surface-container-low border-ghost'}`}
                >
                  <Icon color={isSelected ? '#bd9dff' : '#a3aac4'} size={20} className="mb-2" />
                  <Text className={`text-[10px] font-medium ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`}>{tone.name}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <Button 
          onPress={handleGenerateCopy}
          disabled={generatingText || !textPrompt}
          className="w-full py-3 mb-4"
          icon={generatingText ? <ActivityIndicator size="small" color="#1a0044" /> : <Wand2 color="#1a0044" size={16} />}
        >
          {generatingText ? 'Generating...' : 'Generate Copy'}
        </Button>

        {textOutput ? (
          <View className="bg-surface-container-low border border-ghost rounded-2xl p-4">
            <Text className="text-sm text-on-surface leading-relaxed">{textOutput}</Text>
            <TouchableOpacity onPress={handleCopy} className="flex-row items-center gap-1.5 mt-4 self-end">
              <Copy color="#a3aac4" size={14} />
              <Text className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Copy</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </Card>

      <Card level="high" className="mb-6">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-[#ff97b2]/20 flex items-center justify-center">
              <ImageIcon color="#ff97b2" size={20} />
            </View>
            <Text className="font-display font-bold text-lg text-on-surface">Image Generator</Text>
          </View>
        </View>

        <View className="flex-col gap-2 mb-4">
          <TextInput
            value={imagePrompt}
            onChangeText={setImagePrompt}
            placeholder="Visual prompt..."
            placeholderTextColor="#6d758c"
            className="w-full bg-surface-container-low border border-ghost rounded-xl p-4 text-sm text-on-surface"
          />
          <Button
            onPress={handleGenerateImages}
            disabled={generatingImages || !imagePrompt}
            className="w-full mt-2"
            icon={generatingImages ? <ActivityIndicator size="small" color="#1a0044" /> : <Sparkles color="#1a0044" size={16} />}
          >
            {generatingImages ? 'Generating...' : 'Generate Image'}
          </Button>
        </View>

        <View className="flex-col items-center">
          {generatingImages ? (
            <View style={{ aspectRatio: 1 }} className="w-full rounded-2xl bg-surface-container-low border border-ghost items-center justify-center p-4">
              <ActivityIndicator size="large" color="#bd9dff" className="mb-4" />
              <Text className="text-sm font-bold text-on-surface text-center mb-2">{POLLINATIONS_LOADING_MESSAGES[loadingMessageIdx]}</Text>
              <Text className="text-[10px] text-on-surface-variant uppercase tracking-widest">Powered by Pollinations AI</Text>
            </View>
          ) : imageOutputs.length > 0 ? (
            <View style={{ aspectRatio: 1 }} className="w-full rounded-2xl bg-surface-container-low border border-ghost overflow-hidden relative">
              <Image source={{ uri: imageOutputs[0] }} className="w-full h-full" resizeMode="cover" />
              <TouchableOpacity onPress={handleDownload} className="absolute bottom-4 right-4 p-3 bg-black/60 rounded-full">
                <Download color="white" size={20} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ aspectRatio: 1 }} className="w-full rounded-3xl bg-surface-container-low border-2 border-ghost border-dashed flex-col items-center justify-center opacity-50">
              <ImageIcon color="#a3aac4" size={40} className="mb-4" />
              <Text className="text-sm font-medium text-on-surface">Your masterpiece will appear here</Text>
            </View>
          )}
        </View>
      </Card>
      
      <View className="mb-6">
        <Text className="text-xs font-bold text-on-surface uppercase tracking-widest mb-4">Recent Creations</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-4">
          {recentCreations.map((item: any) => (
            <View key={item.id} className="w-48 p-4 rounded-[1.5rem] bg-surface-container-low border border-ghost mr-4 flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-surface-container-high border border-ghost overflow-hidden flex items-center justify-center">
                {item.thumbnailUrl ? (
                  <Image source={{ uri: item.thumbnailUrl }} className="w-full h-full" />
                ) : (
                  <Type color="#a3aac4" size={16} />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-on-surface" numberOfLines={1}>{item.title}</Text>
                <Text className="text-[10px] text-on-surface-variant capitalize mt-0.5">{item.type}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}
