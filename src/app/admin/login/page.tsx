"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"

export default function LoginPage() {
  const [password, setPassword] = useState("")

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-80 space-y-4 rounded-xl border border-border/60 p-8">
        <h1 className="font-serif text-xl text-gold-gradient">Admin Access</h1>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-border bg-input px-4 py-2 text-sm text-foreground"
        />
        <button
          onClick={() => signIn("credentials", { password, callbackUrl: "/#erp" })}
          className="w-full rounded-full bg-primary py-2 text-sm text-primary-foreground"
        >
          Enter
        </button>
      </div>
    </div>
  )
}
