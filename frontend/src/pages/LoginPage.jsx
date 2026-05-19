import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AUTH_KEY = "bookleaf_auth_user";
const GUEST_EMAIL = "guest@gmail.com";
const GUEST_PASSWORD = "guest123";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    setError("");

    if (email.trim().toLowerCase() !== GUEST_EMAIL || password !== GUEST_PASSWORD) {
      setError("Invalid credentials. Please use the provided guest login.");
      return;
    }

    localStorage.setItem(AUTH_KEY, GUEST_EMAIL);
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,_#ffd9ec_0%,_#fff8fc_38%,_#ffffff_100%)] p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-rose-700">BookLeaf Login</h1>
        <p className="mt-1 text-sm text-rose-400">Sign in to access your automation workspace.</p>

        <div className="mt-5 space-y-3">
          <input
            type="email"
            className="w-full rounded-xl border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="w-full rounded-xl border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
          <button type="submit" className="w-full rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white">
            Login
          </button>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Demo credentials: <span className="font-semibold">guest@gmail.com</span> / <span className="font-semibold">guest123</span>
        </p>
      </form>
    </div>
  );
}
