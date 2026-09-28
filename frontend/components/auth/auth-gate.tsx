"use client";

import { FormEvent, useEffect, useState } from "react";
import { TaskDashboard } from "@/components/tasks/task-dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import type { User } from "@/lib/types";

type Mode = "login" | "register";

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function AuthGate() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState<string>("");

  useEffect(() => {
    authApi
      .me()
      .then((response) => setUser(response.data))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "register") {
        await authApi.register({ email, password, name });
        setMode("login");
        setPassword("");
        setNotice("Account created. Sign in with your password.");
      } else {
        const response = await authApi.login({ email, password, name });
        setUser(response.data);
      }
    } catch (caught) {
      setError(messageOf(caught));
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await authApi.logout();
    setUser(null);
    setPassword("");
  }

  if (checking) {
    return (
      <main className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Checking session…
      </main>
    );
  }

  if (user) return <TaskDashboard user={user} onLogout={logout} />;

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            {mode === "login" ? "Sign in to Taskflow" : "Create your account"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div className="spece-y-2">
              <label htmlFor="name">Name</label>
              <Input
                id="name"
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                minLength={8}
                maxLength={72}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="text-sm text-emerald-700">
                {notice}
              </p>
            )}
            <Button className="w-full" disabled={busy} type="submit">
              {busy ? "Please wait…" : mode === "login" ? "Login" : "Register"}
            </Button>
          </form>
          <Button
            className="mt-3 w-full"
            type="button"
            variant="ghost"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
              setNotice(null);
            }}
          >
            {mode === "login"
              ? "Need an account? Register"
              : "Already registered? Login"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
