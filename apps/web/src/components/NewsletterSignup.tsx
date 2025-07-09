"use client";

import { useState, FormEvent } from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSent(false);
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    try {
      await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
      setEmail("");
    } catch {
      setError("Failed to subscribe.");
    }
  };

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm items-center gap-2">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
          }
          required
        />
        <Button type="submit" variant="outline">
          Subscribe
        </Button>
      </form>
      {sent && <p className="text-green-600 dark:text-green-500 text-sm">Thanks!</p>}
      {error && <p className="text-red-600 dark:text-red-500 text-sm">{error}</p>}
    </div>
  );
}
