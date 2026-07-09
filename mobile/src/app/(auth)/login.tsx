import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { useDispatch } from 'react-redux';
import { Zap, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react-native';
import { login } from '../../store/authSlice';

export default function Login() {
  const dispatch = useDispatch<any>();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: 'email' | 'password', value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setApiError(null);
  };

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      setTouched({ email: true, password: true });
      return;
    }
    
    setIsSubmitting(true);
    setApiError(null);

    try {
      await dispatch(login(form.email, form.password));
      // AuthGuard in _layout will automatically redirect on auth change
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 401) {
        setApiError('Invalid email or password.');
      } else if (status === 429) {
        setApiError('Too many attempts. Try again in 15 minutes.');
      } else {
        setApiError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="p-6">
        <View className="w-full max-w-md mx-auto flex flex-col gap-8">
          
          <View className="flex flex-row items-center gap-3 mb-4">
            <View className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-ambient">
              <Zap color="#1a0044" size={20} />
            </View>
            <Text className="font-display font-bold text-xl tracking-tight text-on-surface">SocioSync</Text>
          </View>

          <View className="flex flex-col gap-2">
            <Text className="text-3xl font-display font-bold text-on-surface tracking-tight">Welcome back</Text>
            <Text className="text-on-surface-variant text-sm">
              Sign in to continue to your command center.
            </Text>
          </View>

          <View className="flex flex-col gap-5">
            {/* Email */}
            <View className="flex flex-col gap-2">
              <Text className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Email Address</Text>
              <View className="relative">
                <View className="absolute z-10 left-4 top-[14px]">
                  <Mail color="#a3aac4" size={16} />
                </View>
                <TextInput
                  value={form.email}
                  onChangeText={(val) => handleChange('email', val)}
                  onBlur={() => setTouched(p => ({ ...p, email: true }))}
                  placeholder="you@example.com"
                  placeholderTextColor="#a3aac466"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className={`w-full bg-surface-container-low border rounded-xl pl-11 pr-4 py-3.5 text-sm text-on-surface ${
                    touched.email && !form.email ? 'border-error' : 'border-outline-variant/15'
                  }`}
                />
              </View>
              {touched.email && !form.email && (
                <Text className="text-[10px] text-error font-medium px-1">Email is required</Text>
              )}
            </View>

            {/* Password */}
            <View className="flex flex-col gap-2">
              <Text className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Password</Text>
              <View className="relative">
                <View className="absolute z-10 left-4 top-[14px]">
                  <Lock color="#a3aac4" size={16} />
                </View>
                <TextInput
                  value={form.password}
                  onChangeText={(val) => handleChange('password', val)}
                  onBlur={() => setTouched(p => ({ ...p, password: true }))}
                  placeholder="Enter your password"
                  placeholderTextColor="#a3aac466"
                  secureTextEntry={!showPassword}
                  className={`w-full bg-surface-container-low border rounded-xl pl-11 pr-12 py-3.5 text-sm text-on-surface ${
                    touched.password && !form.password ? 'border-error' : 'border-outline-variant/15'
                  }`}
                />
                <TouchableOpacity 
                  className="absolute z-10 right-4 top-[14px]"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff color="#a3aac4" size={16} /> : <Eye color="#a3aac4" size={16} />}
                </TouchableOpacity>
              </View>
              {touched.password && !form.password && (
                <Text className="text-[10px] text-error font-medium px-1">Password is required</Text>
              )}
              {apiError && apiError === 'Invalid email or password.' && (
                <Text className="text-[10px] text-error font-medium px-1">{apiError}</Text>
              )}
            </View>

            {/* API Error Banner */}
            {apiError && apiError !== 'Invalid email or password.' && (
              <View className="p-3 rounded-xl bg-error/10 border border-error/20">
                <Text className="text-error text-xs font-medium text-center">{apiError}</Text>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              className={`w-full h-12 rounded-xl flex-row items-center justify-center gap-2 mt-2 ${
                isSubmitting ? 'bg-surface-container-highest opacity-70' : 'bg-primary'
              }`}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator color="#1a0044" size="small" />
                  <Text className="font-bold text-sm text-on-primary">Signing In...</Text>
                </>
              ) : (
                <>
                  <Text className="font-bold text-sm text-on-primary">Sign In</Text>
                  <ArrowRight color="#1a0044" size={16} />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-4">
            <View className="flex-1 h-[1px] bg-outline-variant/15" />
            <Text className="text-[10px] text-on-surface-variant/40 uppercase tracking-widest font-bold">or</Text>
            <View className="flex-1 h-[1px] bg-outline-variant/15" />
          </View>

          <View className="flex-row justify-center items-center">
            <Text className="text-sm text-on-surface-variant">Don't have an account? </Text>
            <Link href="/register" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-semibold text-sm">Create one free</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
