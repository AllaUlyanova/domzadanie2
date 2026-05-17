"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { KidButton } from "@/components/ui/KidButton";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) setErr("Неверный email или пароль");
    else window.location.href = "/learn";
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-4 pb-24 pt-12">
        <h1 className="kid-heading text-center">Вход</h1>
        <form onSubmit={submit} className="kid-card mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-bold">Email родителя</span>
            <input
              type="email"
              className="mt-1 min-h-[48px] w-full rounded-kid border-2 px-3 text-lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold">Пароль</span>
            <input
              type="password"
              className="mt-1 min-h-[48px] w-full rounded-kid border-2 px-3 text-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {err && <p className="text-sm font-bold text-rose-600">{err}</p>}
          <KidButton type="submit" className="w-full">
            Войти
          </KidButton>
        </form>
        <p className="mt-6 text-center text-sm">
          <Link href="/" className="font-bold text-brand-600">
            ← На главную
          </Link>
        </p>
      </main>
    </>
  );
}
