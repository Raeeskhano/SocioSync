import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Zap, Mail, Lock, User, ArrowRight, Eye, EyeOff, Check, X, ShieldCheck, Loader2 } from 'lucide-react';

const passwordChecks = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Contains a number', test: (p) => /[0-9]/.test(p) },
  { label: 'Contains a special character', test: (p) => /[@$!%*?&]/.test(p) },
];

const Register = () => {
  const navigate = useNavigate();
  const { register: registerUser, isAuthenticated } = useAuth();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [apiErrors, setApiErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  // Clear errors when user types
  useEffect(() => {
    setApiErrors({});
  }, [form]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const passwordStrength = passwordChecks.filter((c) => c.test(form.password)).length;
  const strengthPercent = (passwordStrength / passwordChecks.length) * 100;
  const strengthColor =
    strengthPercent >= 100 ? 'bg-primary' : strengthPercent >= 66 ? 'bg-tertiary' : 'bg-error';

  const passwordsMatch = form.password && form.confirmPassword && form.password === form.confirmPassword;
  const passwordsMismatch = form.confirmPassword && !passwordsMatch;

  const canSubmit =
    form.firstName &&
    form.lastName &&
    form.email &&
    form.password &&
    form.confirmPassword &&
    passwordsMatch &&
    passwordStrength === passwordChecks.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ firstName: true, lastName: true, email: true, password: true, confirmPassword: true });

    if (!canSubmit) return;

    setIsSubmitting(true);
    setApiErrors({});
    
    try {
      await registerUser(form.firstName, form.lastName, form.email, form.password, form.confirmPassword);
    } catch (err) {
       const responseData = err.response?.data;
       if (responseData?.errors) {
         const newErrors = {};
         responseData.errors.forEach(e => { 
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
    <div className="min-h-screen bg-background flex">
      {/* Left — Branded Hero */}
      <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden bg-surface-container flex-col justify-between p-12">
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(var(--color-on-surface) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        {/* Radial glow */}
        <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-primary-dim/10 blur-[100px] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center shadow-ambient">
            <Zap className="w-5 h-5 text-on-primary" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight text-on-surface">SocioSync</span>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex flex-col gap-6 max-w-lg">
          <h2 className="text-4xl xl:text-5xl font-display font-bold text-on-surface tracking-tight leading-[1.15]">
            Start building your
            <br />
            <span className="bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">digital empire.</span>
          </h2>
          <p className="text-on-surface-variant text-base leading-relaxed max-w-md">
            Join thousands of creators and marketers who use SocioSync to automate, analyze, and amplify their social presence.
          </p>

          {/* Trust badges */}
          <div className="flex items-center gap-6 mt-4">
            <div className="glass px-4 py-3 rounded-xl border-ghost flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">Enterprise Secure</span>
                <span className="text-[9px] text-on-surface-variant">SOC 2 Compliant</span>
              </div>
            </div>
            <div className="glass px-4 py-3 rounded-xl border-ghost flex items-center gap-3">
              <Zap className="w-5 h-5 text-tertiary" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">Free Forever</span>
                <span className="text-[9px] text-on-surface-variant">No credit card needed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-[10px] text-on-surface-variant/50 uppercase tracking-widest">
          © 2024 SocioSync Inc. All rights reserved.
        </p>
      </div>

      {/* Right — Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md flex flex-col gap-7">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center shadow-ambient">
              <Zap className="w-5 h-5 text-on-primary" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-on-surface">SocioSync</span>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-display font-bold text-on-surface tracking-tight">Create your account</h1>
            <p className="text-on-surface-variant text-sm">Get started — it takes less than a minute.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest px-1">First Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={handleChange('firstName')}
                    onBlur={handleBlur('firstName')}
                    placeholder="Alex"
                    autoComplete="given-name"
                    className={`w-full bg-surface-container-low border rounded-xl pl-10 pr-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none transition-all ${
                      (touched.firstName && !form.firstName) || apiErrors.firstName ? 'border-error' : 'border-ghost focus:border-primary/50'
                    }`}
                  />
                </div>
                {apiErrors.firstName && <span className="text-[10px] text-error font-medium px-1">{apiErrors.firstName}</span>}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Last Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={handleChange('lastName')}
                    onBlur={handleBlur('lastName')}
                    placeholder="Rivera"
                    autoComplete="family-name"
                    className={`w-full bg-surface-container-low border rounded-xl pl-10 pr-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none transition-all ${
                      (touched.lastName && !form.lastName) || apiErrors.lastName ? 'border-error' : 'border-ghost focus:border-primary/50'
                    }`}
                  />
                </div>
                {apiErrors.lastName && <span className="text-[10px] text-error font-medium px-1">{apiErrors.lastName}</span>}
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  onBlur={handleBlur('email')}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`w-full bg-surface-container-low border rounded-xl pl-11 pr-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none transition-all ${
                    (touched.email && !form.email) || apiErrors.email ? 'border-error' : 'border-ghost focus:border-primary/50'
                  }`}
                />
              </div>
              {apiErrors.email && <span className="text-[10px] text-error font-medium px-1">{apiErrors.email}</span>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange('password')}
                  onBlur={handleBlur('password')}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  className={`w-full bg-surface-container-low border rounded-xl pl-11 pr-12 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none transition-all ${
                    (touched.password && !form.password) || apiErrors.password ? 'border-error' : 'border-ghost focus:border-primary/50'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {apiErrors.password && <span className="text-[10px] text-error font-medium px-1">{apiErrors.password}</span>}

              {/* Strength bar */}
              {form.password && (
                <div className="flex flex-col gap-2 mt-1">
                  <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${strengthColor}`}
                      style={{ width: `${strengthPercent}%` }}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    {passwordChecks.map((check) => {
                      const passed = check.test(form.password);
                      return (
                        <div key={check.label} className="flex items-center gap-2">
                          {passed ? (
                            <Check className="w-3 h-3 text-primary" />
                          ) : (
                            <X className="w-3 h-3 text-on-surface-variant/40" />
                          )}
                          <span className={`text-[10px] font-medium ${passed ? 'text-primary' : 'text-on-surface-variant/50'}`}>
                            {check.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Confirm Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  onBlur={handleBlur('confirmPassword')}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  className={`w-full bg-surface-container-low border rounded-xl pl-11 pr-12 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none transition-all ${
                    passwordsMismatch || apiErrors.confirmPassword ? 'border-error' : passwordsMatch ? 'border-primary/50' : 'border-ghost focus:border-primary/50'
                  }`}
                />
                {passwordsMatch && (
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                )}
              </div>
              {passwordsMismatch && (
                <span className="text-[10px] text-error font-medium px-1">Passwords do not match</span>
              )}
              {apiErrors.confirmPassword && (
                <span className="text-[10px] text-error font-medium px-1">{apiErrors.confirmPassword}</span>
              )}
            </div>

            {/* API general error */}
            {apiErrors.general && (
              <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium text-center">
                {apiErrors.general}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className={`w-full h-12 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 mt-2 ${
                canSubmit && !isSubmitting
                  ? 'bg-gradient-to-r from-primary to-primary-dim text-on-primary shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-ghost" />
            <span className="text-[10px] text-on-surface-variant/40 uppercase tracking-widest font-bold">or</span>
            <div className="flex-1 h-px bg-ghost" />
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-on-surface-variant">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:text-primary-light transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
