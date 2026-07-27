import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }
    try {
      await register(email, password);
      navigate("/");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } };
        if (axiosErr.response?.status === 409) {
          setError("Diese E-Mail-Adresse wird bereits verwendet.");
          return;
        }
      }
      setError("Registrierung fehlgeschlagen. Bitte versuche es erneut.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="bg-card_bg rounded-lg shadow-card p-6 w-full max-w-md">
        <h1 className="text-xl font-semibold mb-4 text-center">Registrieren</h1>
        {error && (
          <div className="bg-danger-light text-danger rounded-md p-3 mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-border rounded-md px-4 py-3 text-sm min-h-[44px] focus:border-accent focus:ring-3 focus:ring-accent-light outline-none"
              placeholder="max@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full border border-border rounded-md px-4 py-3 text-sm min-h-[44px] focus:border-accent focus:ring-3 focus:ring-accent-light outline-none"
              placeholder="Mindestens 8 Zeichen"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-accent text-white rounded-md py-3 px-5 font-medium min-h-[44px] hover:bg-accent-hover active:scale-[0.97] transition-transform duration-150"
          >
            Konto erstellen
          </button>
        </form>
        <p className="text-sm text-muted text-center mt-4">
          Bereits registriert?{" "}
          <Link to="/login" className="text-accent hover:underline">
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}
