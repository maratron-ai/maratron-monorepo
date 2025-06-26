"use client";

import { useState, FormEvent } from "react";
import { Input, Textarea, Button } from "@components/ui";

export default function ContactForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSent(false);
    if (!email || !message) {
      setError("Please fill in all fields.");
      return;
    }
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message }),
      });
      setSent(true);
      setEmail("");
      setMessage("");
    } catch {
      setError("Failed to send message.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && <p className="text-brand-orange-dark">{error}</p>}
      {sent && <p className="text-primary">Message sent!</p>}
      <Input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setEmail(e.target.value)
        }
        required
      />
      <Textarea
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        required
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          className="block w-auto text-foreground bg-transparent no-underline transition-colors hover:text-background hover:no-underline hover:bg-brand-from"
        >
          Send
        </Button>
      </div>
    </form>
  );
}
