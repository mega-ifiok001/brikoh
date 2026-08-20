"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { isValidEmail } from "@/lib/auth";
import { ApiError } from "@/api/types";
import { TextInput, PasswordInput, PrimaryButton, AlertBox, SuccessPanel } from "./AuthUI";
import { Mail, Lock, User, Phone } from "@/components/icons";

export default function SignupScreen() {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (firstName.trim().length < 1) { setError("First name is required."); return; }
    if (lastName.trim().length < 1) { setError("Last name is required."); return; }
    if (phone.replace(/\D/g, "").length < 7) { setError("Enter a valid phone number."); return; }
    if (!isValidEmail(email)) { setError("Please enter a valid email address."); return; }
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      setError("Password must be at least 8 characters with at least one letter and one digit.");
      return;
    }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (!terms) { setError("Please accept the Terms of Service."); return; }
    setLoading(true);
    try {
      const user = await register({ firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim(), email, password, confirmPassword: confirm });
      setDone(true);
      setTimeout(() => {
        window.location.hash = user.needsOnboarding ? "/onboarding" : "/dashboard";
      }, 800);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
      setLoading(false);
    }
  }

  if (done) return <SuccessPanel title="Your account is ready! 🎉" subtitle="Taking you to set up your business…" />;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error && <AlertBox>{error}</AlertBox>}
      <div className="grid grid-cols-2 gap-4">
        <TextInput label="First name" icon={<User className="h-5 w-5" />} placeholder="Amara" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <TextInput label="Last name" placeholder="Obi" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
      </div>
      <TextInput label="Phone" type="tel" icon={<Phone className="h-5 w-5" />} placeholder="+234 800 123 4567" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <TextInput label="Email address" type="email" icon={<Mail className="h-5 w-5" />} placeholder="you@business.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <PasswordInput label="Password" icon={<Lock className="h-5 w-5" />} placeholder="Min 8 chars, letters + digits" autoComplete="new-password" withMeter value={password} onChange={(e) => setPassword(e.target.value)} />
      <PasswordInput label="Confirm password" icon={<Lock className="h-5 w-5" />} placeholder="Re-enter your password" autoComplete="new-password" error={confirm.length > 0 && password !== confirm ? "Passwords do not match." : undefined} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded accent-brand" />
        <span className="text-sm leading-relaxed text-muted">
          I agree to Brikoh's <a href="#/" className="font-semibold text-brand">Terms of Service</a> and{" "}
          <a href="#/" className="font-semibold text-brand">Privacy Policy</a>.
        </span>
      </label>
      <PrimaryButton loading={loading}>Create my free account</PrimaryButton>
      <p className="pt-2 text-center text-sm text-muted">
        Already have an account?{" "}
        <a href="#/login" className="font-bold text-brand hover:text-brand-light">Log in</a>
      </p>
    </form>
  );
}
