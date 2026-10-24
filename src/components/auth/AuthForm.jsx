"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { API_ORIGIN, authClient } from "../../lib/auth-client";
import { completeRoleOnboarding } from "../../lib/account-api";

function validateRegistration(values) {
  const errors = {};

  if (values.name.trim().length < 2 || values.name.trim().length > 80) {
    errors.name = "Name must be between 2 and 80 characters.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  try {
    const image = new URL(values.image.trim());
    if (!["https:", "http:"].includes(image.protocol)) throw new Error();
  } catch {
    errors.image = "Enter a valid profile image URL.";
  }
  if (
    values.password.length < 12 ||
    !/[a-z]/.test(values.password) ||
    !/[A-Z]/.test(values.password) ||
    !/[0-9]/.test(values.password) ||
    !/[^A-Za-z0-9]/.test(values.password)
  ) {
    errors.password = "Use 12 or more characters with uppercase, lowercase, a number, and a symbol.";
  }

  return errors;
}

export default function AuthForm({ mode }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [role, setRole] = useState("supporter");

  useEffect(() => {
    let active = true;
    fetch(`${API_ORIGIN}/api/config`, { credentials: "include" })
      .then((response) => response.ok ? response.json() : null)
      .then((config) => {
        if (active) setGoogleEnabled(config?.googleSignInEnabled === true);
      })
      .catch(() => {
        if (active) setGoogleEnabled(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrors({});
    setFormError("");

    const formData = new FormData(event.currentTarget);
    const values = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || "").trim(),
      image: String(formData.get("image") || "").trim(),
      password: String(formData.get("password") || ""),
    };

    if (isRegister) {
      const validationErrors = validateRegistration(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      setErrors({ email: "Enter a valid email address." });
      return;
    }

    setIsPending(true);
    try {
      const result = isRegister
        ? await authClient.signUp.email({
            name: values.name.trim(),
            email: values.email,
            image: values.image,
            password: values.password,
            callbackURL: `${window.location.origin}/dashboard?onboarding=required`,
          })
        : await authClient.signIn.email({
            email: values.email,
            password: values.password,
            callbackURL: `${window.location.origin}/dashboard`,
          });

      if (result.error) {
        setFormError(result.error.message || (isRegister
          ? "We could not create your account. Check your details and try again."
          : "Email or password is incorrect."));
        return;
      }

      if (isRegister) {
        try {
          await completeRoleOnboarding(role);
          await authClient.getSession({ query: { disableCookieCache: true } });
          router.replace("/dashboard");
        } catch {
          router.replace("/dashboard?onboarding=required");
        }
      } else {
        const user = result.data?.user;
        router.replace(user?.role === "pending" ? "/dashboard?onboarding=required" : "/dashboard");
      }
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleGoogleSignIn() {
    setFormError("");
    setIsPending(true);
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/dashboard`,
        newUserCallbackURL: `${window.location.origin}/dashboard?onboarding=required`,
        errorCallbackURL: `${window.location.origin}/${mode}?error=google`,
      });
      if (result.error) throw new Error(result.error.message || "Google sign-in failed.");
      if (result.data?.url) window.location.assign(result.data.url);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Google sign-in is unavailable.");
      setIsPending(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-page__intro">
        <p className="section-eyebrow">{isRegister ? "Start with an idea" : "Welcome back"}</p>
        <h1>{isRegister ? "Make room for what is next." : "Your next good idea is close."}</h1>
        <p>
          {isRegister
            ? "Create an account to support community projects or bring your own idea to life."
            : "Sign in to follow the projects and people you care about."}
        </p>
      </section>

      <section aria-labelledby="auth-form-title" className="auth-panel">
        <div className="auth-panel__heading">
          <h2 id="auth-form-title">{isRegister ? "Create your account" : "Sign in"}</h2>
          <p>{isRegister ? "Your role sets your one-time starting credits." : "Use your account email and password."}</p>
        </div>

        <form className="auth-form" noValidate onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <label className="auth-field">
                <span>Name</span>
                <input autoComplete="name" maxLength={80} minLength={2} name="name" required />
                {errors.name && <small className="auth-field__error">{errors.name}</small>}
              </label>
              <label className="auth-field">
                <span>Profile picture URL</span>
                <input autoComplete="url" name="image" placeholder="https://example.com/profile.jpg" required type="url" />
                {errors.image && <small className="auth-field__error">{errors.image}</small>}
              </label>
            </>
          )}

          <label className="auth-field">
            <span>Email</span>
            <input autoComplete="email" name="email" required type="email" />
            {errors.email && <small className="auth-field__error">{errors.email}</small>}
          </label>

          {isRegister && (
            <label className="auth-field">
              <span>Account role</span>
              <select onChange={(event) => setRole(event.target.value)} value={role}>
                <option value="supporter">Supporter · 50 starting credits</option>
                <option value="creator">Creator · 20 starting credits</option>
              </select>
            </label>
          )}

          <label className="auth-field">
            <span>Password</span>
            <span className="auth-field__password">
              <input
                autoComplete={isRegister ? "new-password" : "current-password"}
                maxLength={128}
                minLength={isRegister ? 12 : 1}
                name="password"
                required
                type={showPassword ? "text" : "password"}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((shown) => !shown)}
                type="button"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </span>
            {isRegister && <small className="auth-field__hint">12+ characters with upper- and lowercase letters, a number, and a symbol.</small>}
            {errors.password && <small className="auth-field__error">{errors.password}</small>}
          </label>

          {formError && <p aria-live="polite" className="auth-form__error" role="alert">{formError}</p>}

          <button className="auth-form__submit" disabled={isPending} type="submit">
            {isPending ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="auth-divider"><span>or continue with</span></div>
        <button
          className="auth-form__google"
          disabled={isPending || !googleEnabled}
          onClick={handleGoogleSignIn}
          title={googleEnabled ? "Continue with Google" : "Google sign-in requires server OAuth credentials"}
          type="button"
        >
          <FcGoogle aria-hidden="true" />
          {googleEnabled ? "Google" : "Google sign-in unavailable"}
        </button>

        <p className="auth-panel__switch">
          {isRegister ? "Already have an account? " : "New to crowdfunding? "}
          <Link href={isRegister ? "/login" : "/register"}>{isRegister ? "Sign in" : "Create an account"}</Link>
        </p>
      </section>
    </main>
  );
}