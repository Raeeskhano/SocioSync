import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { Link } from 'expo-router';
import { useDispatch } from 'react-redux';
import { Zap, Mail, Lock, User, ArrowRight, Eye, EyeOff, Check, X } from 'lucide-react-native';
import { authService } from '../../api/authService';
import { loginSuccess } from '../../store/authSlice';
import * as SecureStore from 'expo-secure-store';

const passwordChecks = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Contains uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Contains a number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'Contains a special character', test: (p: string) => /[@$!%*?&]/.test(p) },
];

export default function Register() {
  const dispatch = useDispatch<any>();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<any>({});
  const [apiErrors, setApiErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setApiErrors({});
  };

  const handleBlur = (field: string) => {
    setTouched((prev: any) => ({ ...prev, [field]: true }));
  };

  const passwordStrength = passwordChecks.filter((c) => c.test(form.password)).length;
  const strengthPercent = (passwordStrength / passwordChecks.length) * 100;
  const strengthColor = strengthPercent >= 100 ? 'bg-primary' : strengthPercent >= 66 ? 'bg-tertiary' : 'bg-error';

  const passwordsMatch = form.password && form.confirmPassword && form.password === form.confirmPassword;
  const passwordsMismatch = form.confirmPassword && !passwordsMatch;

  const canSubmit = form.firstName && form.lastName && form.email && form.password && form.confirmPassword && passwordsMatch && passwordStrength === passwordChecks.length;

  const handleSubmit = async () => {
    setTouched({ firstName: true, lastName: true, email: true, password: true, confirmPassword: true });
    if (!canSubmit) return;

    setIsSubmitting(true);
    setApiErrors({});
    
    try {
      const data = await authService.register(form.firstName, form.lastName, form.email, form.password, form.confirmPassword);
      if (data.success && data.token) {
        await SecureStore.setItemAsync('sociosync_token', data.token);
        await SecureStore.setItemAsync('sociosync_user', JSON.stringify(data.user));
        dispatch(loginSuccess({ token: data.token, user: data.user }));
      }
    } catch (err: any) {
       const responseData = err.response?.data;
       if (responseData?.errors) {
         const newErrors: any = {};
         responseData.errors.forEach((e: any) => { 
           const field = e.path || e.field;
           const msg = e.msg || e.message;
           if (field && msg) newErrors[field] = msg;
         });
         setApiErrors(newErrors);
       } else if (responseData?.message) {
         setApiErrors({ email: responseData.message });
       } else {
         setApiErrors({ general: 'Something went wrong. Please try again.' });
       }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="p-6">
        <View className="w-full max-w-md mx-auto flex flex-col gap-6">
          <View className="flex flex-row items-center gap-4 mb-4 mt-2">
            <View className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-ambient overflow-hidden">
              <Image source={require('../../../assets/logo.png')} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
            </View>
            <Text className="font-display font-bold text-3xl tracking-tight text-on-surface">SocioSync</Text>
          </View>

          <View className="flex flex-col gap-1">
            <Text className="text-3xl font-display font-bold text-on-surface tracking-tight">Create your account</Text>
            <Text className="text-on-surface-variant text-sm">Get started — it takes less than a minute.</Text>
          </View>

          <View className="flex flex-col gap-4">
            <View className="flex flex-row gap-4">
              <View className="flex-1 flex-col gap-2">
                <Text className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest px-1">First Name</Text>
                <View className="relative">
                  <View className="absolute z-10 left-3 top-[12px]"><User color="#a3aac4" size={16} /></View>
                  <TextInput
                    value={form.firstName}
                    onChangeText={(val) => handleChange('firstName', val)}
                    onBlur={() => handleBlur('firstName')}
                    placeholder="Alex"
                    placeholderTextColor="#a3aac466"
                    className={`bg-surface-container-low border rounded-xl pl-9 pr-3 py-3 text-sm text-on-surface ${((touched.firstName && !form.firstName) || apiErrors.firstName) ? 'border-error' : 'border-outline-variant/15'}`}
                  />
                </View>
                {apiErrors.firstName && <Text className="text-[10px] text-error font-medium px-1">{apiErrors.firstName}</Text>}
              </View>
              <View className="flex-1 flex-col gap-2">
                <Text className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Last Name</Text>
                <View className="relative">
                  <View className="absolute z-10 left-3 top-[12px]"><User color="#a3aac4" size={16} /></View>
                  <TextInput
                    value={form.lastName}
                    onChangeText={(val) => handleChange('lastName', val)}
                    onBlur={() => handleBlur('lastName')}
                    placeholder="Rivera"
                    placeholderTextColor="#a3aac466"
                    className={`bg-surface-container-low border rounded-xl pl-9 pr-3 py-3 text-sm text-on-surface ${((touched.lastName && !form.lastName) || apiErrors.lastName) ? 'border-error' : 'border-outline-variant/15'}`}
                  />
                </View>
                {apiErrors.lastName && <Text className="text-[10px] text-error font-medium px-1">{apiErrors.lastName}</Text>}
              </View>
            </View>

            {/* Email */}
            <View className="flex flex-col gap-2">
              <Text className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Email</Text>
              <View className="relative">
                <View className="absolute z-10 left-4 top-[14px]"><Mail color="#a3aac4" size={16} /></View>
                <TextInput
                  value={form.email}
                  onChangeText={(val) => handleChange('email', val)}
                  onBlur={() => handleBlur('email')}
                  placeholder="you@example.com"
                  placeholderTextColor="#a3aac466"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className={`bg-surface-container-low border rounded-xl pl-11 pr-4 py-3.5 text-sm text-on-surface ${((touched.email && !form.email) || apiErrors.email) ? 'border-error' : 'border-outline-variant/15'}`}
                />
              </View>
              {apiErrors.email && <Text className="text-[10px] text-error font-medium px-1">{apiErrors.email}</Text>}
            </View>

            {/* Password */}
            <View className="flex flex-col gap-2">
              <Text className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Password</Text>
              <View className="relative">
                <View className="absolute z-10 left-4 top-[14px]"><Lock color="#a3aac4" size={16} /></View>
                <TextInput
                  value={form.password}
                  onChangeText={(val) => handleChange('password', val)}
                  onBlur={() => handleBlur('password')}
                  placeholder="Create a strong password"
                  placeholderTextColor="#a3aac466"
                  secureTextEntry={!showPassword}
                  className={`bg-surface-container-low border rounded-xl pl-11 pr-12 py-3.5 text-sm text-on-surface ${((touched.password && !form.password) || apiErrors.password) ? 'border-error' : 'border-outline-variant/15'}`}
                />
                <TouchableOpacity className="absolute z-10 right-4 top-[14px]" onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff color="#a3aac4" size={16} /> : <Eye color="#a3aac4" size={16} />}
                </TouchableOpacity>
              </View>
              {apiErrors.password && <Text className="text-[10px] text-error font-medium px-1">{apiErrors.password}</Text>}
              
              {form.password.length > 0 && (
                <View className="flex flex-col gap-2 mt-1">
                  <View className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <View className={`h-full rounded-full ${strengthColor}`} style={{ width: `${strengthPercent}%` }} />
                  </View>
                  <View className="flex flex-col gap-1">
                    {passwordChecks.map((check) => {
                      const passed = check.test(form.password);
                      return (
                        <View key={check.label} className="flex flex-row items-center gap-2">
                          {passed ? <Check color="#bd9dff" size={12} /> : <X color="#a3aac466" size={12} />}
                          <Text className={`text-[10px] font-medium ${passed ? 'text-primary' : 'text-on-surface-variant/50'}`}>{check.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View className="flex flex-col gap-2">
              <Text className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Confirm Password</Text>
              <View className="relative">
                <View className="absolute z-10 left-4 top-[14px]"><Lock color="#a3aac4" size={16} /></View>
                <TextInput
                  value={form.confirmPassword}
                  onChangeText={(val) => handleChange('confirmPassword', val)}
                  onBlur={() => handleBlur('confirmPassword')}
                  placeholder="Repeat your password"
                  placeholderTextColor="#a3aac466"
                  secureTextEntry={!showPassword}
                  className={`bg-surface-container-low border rounded-xl pl-11 pr-12 py-3.5 text-sm text-on-surface ${passwordsMismatch || apiErrors.confirmPassword ? 'border-error' : passwordsMatch ? 'border-primary/50' : 'border-outline-variant/15'}`}
                />
                {passwordsMatch && (
                  <View className="absolute z-10 right-4 top-[14px]">
                    <Check color="#bd9dff" size={16} />
                  </View>
                )}
              </View>
              {passwordsMismatch && <Text className="text-[10px] text-error font-medium px-1">Passwords do not match</Text>}
              {apiErrors.confirmPassword && <Text className="text-[10px] text-error font-medium px-1">{apiErrors.confirmPassword}</Text>}
            </View>

            {apiErrors.general && (
              <View className="p-3 rounded-xl bg-error/10 border border-error/20">
                <Text className="text-error text-xs font-medium text-center">{apiErrors.general}</Text>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className={`w-full h-12 rounded-xl flex-row items-center justify-center gap-2 mt-2 ${canSubmit && !isSubmitting ? 'bg-primary' : 'bg-surface-container-highest opacity-70'}`}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator color="#1a0044" size="small" />
                  <Text className="font-bold text-sm text-on-primary">Creating Account...</Text>
                </>
              ) : (
                <>
                  <Text className={`font-bold text-sm ${canSubmit ? 'text-on-primary' : 'text-on-surface-variant'}`}>Create Account</Text>
                  <ArrowRight color={canSubmit ? '#1a0044' : '#a3aac4'} size={16} />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center items-center mt-4">
            <Text className="text-sm text-on-surface-variant">Already have an account? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-semibold text-sm">Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
