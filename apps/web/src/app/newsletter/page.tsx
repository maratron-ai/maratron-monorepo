"use client";

import { useState } from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Card, CardContent } from "@components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Checkbox } from "@components/ui/checkbox";
import { Send, Mail, Calendar, TrendingUp } from "lucide-react";

export default function NewsletterPage() {
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubscribed(true);
    setIsSubmitting(false);
  };

  const pastIssues = [
    {
      id: 1,
      title: "Running Training Plans: Science-Based Approaches for 2024",
      date: "December 15, 2024",
      description: "Dive into the latest research on periodization, progressive overload, and training adaptations for runners.",
      topics: ["Training Plans", "Exercise Science", "Performance"]
    },
    {
      id: 2,
      title: "Nutrition Strategies for Long Distance Running",
      date: "November 28, 2024", 
      description: "Learn about fueling strategies, hydration protocols, and recovery nutrition for endurance athletes.",
      topics: ["Nutrition", "Hydration", "Recovery"]
    },
    {
      id: 3,
      title: "Injury Prevention and Biomechanics Analysis",
      date: "November 14, 2024",
      description: "Understanding running form, common injury patterns, and evidence-based prevention strategies.",
      topics: ["Injury Prevention", "Biomechanics", "Form Analysis"]
    }
  ];

  if (isSubscribed) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <div className="container mx-auto px-6 py-16 max-w-4xl">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Welcome to the Maratron Newsletter!
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Thanks for subscribing! You'll receive our latest running tips, training guides, and performance insights twice a month.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <a href="/">Return to Home</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
            Subscribe to our
            <br />
            runner newsletter
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Get tips, technical guides, and best practices for running. Twice a month.
            <br />
            Right in your inbox.
          </p>
        </div>

        {/* Subscription Form */}
        <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm mb-20">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Work Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Country *
                </Label>
                <Select value={country} onValueChange={setCountry} required>
                  <SelectTrigger className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700">
                    <SelectValue placeholder="United States of America (the)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States of America</SelectItem>
                    <SelectItem value="ca">Canada</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="au">Australia</SelectItem>
                    <SelectItem value="de">Germany</SelectItem>
                    <SelectItem value="fr">France</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={setAgreedToTerms}
                  className="mt-1"
                />
                <Label htmlFor="terms" className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Yes please, I'd like Maratron and affiliates to use my information for 
                  personalized communications, targeted advertising and campaign 
                  effectiveness. See the{" "}
                  <a href="/privacy" className="text-zinc-900 dark:text-zinc-100 hover:underline">
                    Maratron Privacy Statement
                  </a>{" "}
                  for more details.
                </Label>
              </div>

              <Button
                type="submit"
                disabled={!email || !country || !agreedToTerms || isSubmitting}
                className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 h-12"
              >
                {isSubmitting ? (
                  "Subscribing..."
                ) : (
                  <>
                    Subscribe <Send className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Past Issues Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Explore past issues
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Dive into past editions of the newsletter. Be sure to sign up
            <br />
            above to get the latest as soon as it ships.
          </p>
        </div>

        {/* Past Issues Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {pastIssues.map((issue) => (
            <Card key={issue.id} className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">{issue.date}</span>
                </div>
                
                <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 mb-3 leading-snug">
                  {issue.title}
                </h3>
                
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed flex-1">
                  {issue.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {issue.topics.map((topic) => (
                    <span
                      key={topic}
                      className="px-2 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs rounded-md"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="w-full justify-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 mt-auto"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Read Issue
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}