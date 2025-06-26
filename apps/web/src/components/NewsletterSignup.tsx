"use client";

import { useState, FormEvent } from "react";
import { Input, Button } from "@components/ui";

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
    <form onSubmit={handleSubmit} className="flex items-center space-x-2">
      <Input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setEmail(e.target.value)
        }
        className="max-w-xs"
        required
      />
      <Button
        type="submit"
        size="sm"
        className="block w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from"
      >
        Subscribe
      </Button>
      {sent && <p className="text-primary ml-2">Thanks!</p>}
      {error && <p className="text-brand-orange-dark ml-2">{error}</p>}
    </form>
  );
}
