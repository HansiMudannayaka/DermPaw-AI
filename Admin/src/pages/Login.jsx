
import { useState } from "react";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  PawPrint,
  ShieldCheck,
} from "lucide-react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (username.trim() === "admin" && password === "admin@123") {
      setHasError(false);
      onLogin();
      return;
    }

    setHasError(true);
  };

  return (
    <main className="grid min-h-screen overflow-y-auto bg-[#F6F1FF] text-[#201b2b] lg:grid-cols-[1.05fr_0.95fr]">
      {/* Left Branding Section */}
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#4B0082] px-12 py-10 text-white lg:flex xl:px-20">
        <div className="absolute inset-0 opacity-10 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:56px_56px]" />

        <div className="absolute -right-24 top-1/4 h-80 w-80 rounded-full border border-[#D9B8FF]/20" />
        <div className="absolute -right-12 top-[29%] h-56 w-56 rounded-full border border-[#D9B8FF]/20" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#4B0082] shadow-lg shadow-black/10">
            <PawPrint size={23} strokeWidth={2.4} />
          </div>

          <div>
            <p className="text-lg font-bold leading-tight">DermPaw AI</p>
            <p className="mt-1 text-xs tracking-wider text-white/60">
              ADMINISTRATION
            </p>
          </div>
        </div>

        <div className="relative max-w-xl pb-10">
          <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D9B8FF]">
            <span className="h-px w-8 bg-[#D9B8FF]" />
            Veterinary care intelligence
          </div>

          <h1 className="max-w-lg text-5xl font-semibold leading-[1.08] tracking-tight xl:text-6xl">
            Better insight.
            <br />
            Healthier paws.
          </h1>

          <p className="mt-6 max-w-md text-base leading-7 text-white/70">
            A focused workspace for monitoring skin health, clinical activity,
            and the care teams behind every diagnosis.
          </p>

          <div className="mt-10 flex items-center gap-3 border-t border-white/15 pt-5 text-sm text-white/75">
            <ShieldCheck size={18} className="text-[#D9B8FF]" />
            Secure administrator access
          </div>
        </div>

        <p className="relative text-xs text-white/45">
          DermPaw AI · Veterinary management platform
        </p>
      </section>

      {/* Login Section */}
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[420px]">
          {/* Mobile Branding */}
          <div className="mb-12 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4B0082] text-white">
              <PawPrint size={21} />
            </div>

            <div>
              <p className="font-bold text-[#4B0082]">DermPaw AI</p>
              <p className="text-xs text-[#77717f]">Admin Dashboard</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#8A2BE2]">
              Administrator portal
            </p>

            <h2 className="text-3xl font-semibold tracking-tight text-[#201b2b]">
              Welcome back
            </h2>

            <p className="mt-2 text-sm text-[#77717f]">
              Sign in to continue to your workspace.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-[#383242]"
              >
                Username
              </label>

              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setHasError(false);
                }}
                placeholder="Enter your username"
                className="h-12 w-full rounded-lg border border-[#E2D5F5] bg-white px-4 text-sm outline-none transition placeholder:text-[#A49BAF] focus:border-[#8A2BE2] focus:ring-4 focus:ring-[#8A2BE2]/10"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-[#383242]"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setHasError(false);
                  }}
                  placeholder="Enter your password"
                  className="h-12 w-full rounded-lg border border-[#E2D5F5] bg-white px-4 pr-12 text-sm outline-none transition placeholder:text-[#A49BAF] focus:border-[#8A2BE2] focus:ring-4 focus:ring-[#8A2BE2]/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#8B8297] transition hover:text-[#4B0082]"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {hasError && (
              <p role="alert" className="text-sm text-[#B42338]">
                Username or password is incorrect. Please try again.
              </p>
            )}

            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#4B0082] text-sm font-semibold text-white shadow-md shadow-[#4B0082]/10 transition hover:bg-[#8A2BE2] focus:outline-none focus:ring-4 focus:ring-[#8A2BE2]/20 active:scale-[0.99]"
            >
              <LockKeyhole size={16} />
              Sign in
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 border-t border-[#E5DDF0] pt-5 text-center text-xs text-[#8B8592]">
            Authorized DermPaw AI administrators only
          </p>
        </div>
      </section>
    </main>
  );
}