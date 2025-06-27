import Image from "next/image";
import Link from "next/link";
import { Button } from "@components/ui/button";
import { Card } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import {
  PlayCircle,
  CheckCircle,
  ArrowRight,
  Award,
  Target,
  Watch,
  TrendingUp,
  Clock,
  Brain,
} from "lucide-react";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Maratron - AI-Powered Marathon Training Coach',
  description: 'Break through plateaus and achieve your marathon dreams with AI-powered training that adapts to you. Personalized coaching based on Jack Daniels VDOT science.',
  keywords: ['marathon training', 'running coach', 'AI fitness', 'VDOT calculator', 'personalized training plan', 'running analytics'],
  authors: [{ name: 'Maratron Team' }],
  openGraph: {
    title: 'Maratron - Your Personal Marathon Coach, Reimagined',
    description: 'AI-powered training that adapts to you. Break through plateaus with intelligent coaching based on proven science.',
    url: 'https://maratron.com',
    siteName: 'Maratron',
    type: 'website',
    images: [
      {
        url: '/maratron-name-gradient-purple.svg',
        width: 1200,
        height: 630,
        alt: 'Maratron - AI Marathon Training',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Maratron - AI-Powered Marathon Training',
    description: 'Intelligent coaching that evolves with every step. Join thousands breaking their personal bests.',
    images: ['/maratron-name-gradient-purple.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function Landing() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden" aria-label="Hero section">
        <div className="absolute inset-0 bg-background backdrop-blur-sm z-0"></div>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="w-full text-center">
            <Image
              src="/maratron-name-gradient-purple.svg"
              alt="Maratron - AI-Powered Marathon Training Coach"
              width={1200}
              height={300}
              priority
              className="mx-auto mb-6 py-8"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            />
            <Badge className="mb-6 bg-gradient-to-r from-[var(--brand-from)] to-[var(--brand-to)] text-white border-0">
              Powered by Advanced AI Training Science
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground leading-tight drop-shadow-sm pt-20">
              Your Personal Marathon Coach,{" "}
              <span className="text-gradient bg-gradient-to-r from-[var(--brand-from)] to-[var(--brand-to)] bg-clip-text text-transparent">
                Reimagined
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed mx-auto max-w-screen-md px-4">
              Break through plateaus and achieve your marathon dreams with
              AI-powered training that adapts to you. No more rigid plans—just
              intelligent coaching that evolves with every step.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[var(--brand-from)] to-[var(--brand-to)] hover:from-[var(--brand-from)] hover:to-[var(--brand-to)] text-white border-0 text-lg px-8 py-6 transition-all duration-200"
                >
                  Start Now
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
              <Link
                href="https://www.youtube.com/watch?v=0_DjDdfqtUE"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Watch Maratron demo video on YouTube"
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6 transition-all duration-200"
                >
                  <PlayCircle className="mr-2 h-5 w-5" aria-hidden="true" />
                  Watch Demo
                </Button>
              </Link>
            </div>
            <ul className="flex items-center justify-center space-x-8 text-sm text-muted-foreground list-none" role="list">
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-primary" aria-hidden="true" />
                Completely free to start
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-primary" aria-hidden="true" />
                AI powered training plans
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-primary" aria-hidden="true" />
                Scientifically proven methods
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20" aria-labelledby="features-heading">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 id="features-heading" className="text-4xl md:text-5xl font-bold mb-6">
              Training That Actually{" "}
              <span className="text-gradient bg-gradient-to-r from-[var(--brand-from)] to-[var(--brand-to)] bg-clip-text text-transparent">
                Gets You There
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mx-auto max-w-screen-md px-4">
              Stop guessing. Start succeeding. Maratron combines cutting-edge AI
              with proven training science to create your perfect marathon
              journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16" role="region" aria-label="Feature cards">
            <Card className="p-8 border border-muted bg-background dark:bg-background shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--brand-purple)] to-[var(--brand-blue)] rounded-lg flex items-center justify-center mb-6 ring-2 ring-white dark:ring-white">
                <Brain className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-4">
                AI-Powered Personalization
              </h3>
              <p className="text-muted-foreground">
                Your training adapts weekly based on your progress, recovery,
                and life. No more one-size-fits-all plans that ignore your
                reality.
              </p>
            </Card>

            <Card className="p-8 border border-muted bg-background dark:bg-background shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--brand-purple)] to-[var(--brand-blue)] rounded-lg flex items-center justify-center mb-6 ring-2 ring-white dark:ring-white">
                <Target className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-4">
                VDOT & Race Prediction
              </h3>
              <p className="text-muted-foreground">
                Know exactly what you&apos;re capable of. Our AI predicts your
                race times and tracks fitness improvements with scientific
                precision.
              </p>
            </Card>

            <Card className="p-8 border border-muted bg-background dark:bg-background shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--brand-purple)] to-[var(--brand-blue)] rounded-lg flex items-center justify-center mb-6 ring-2 ring-white dark:ring-white">
                <Watch className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-4">
                Seamless Device Integration
              </h3>
              <p className="text-muted-foreground">
                Connect your Garmin, Apple Watch, or other devices. Your
                workouts sync automatically—no manual logging required.
              </p>
            </Card>

            <Card className="p-8 border border-muted bg-background dark:bg-background shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--brand-purple)] to-[var(--brand-blue)] rounded-lg flex items-center justify-center mb-6 ring-2 ring-white dark:ring-white">
                <TrendingUp className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-4">
                Smart Load Management
              </h3>
              <p className="text-muted-foreground">
                Built on ACWR principles to prevent injury and optimize
                performance. Train harder when you can, recover when you need
                to.
              </p>
            </Card>

            <Card className="p-8 border border-muted bg-background dark:bg-background shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--brand-purple)] to-[var(--brand-blue)] rounded-lg flex items-center justify-center mb-6 ring-2 ring-white dark:ring-white">
                <Clock className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Perfect Tapering</h3>
              <p className="text-muted-foreground">
                Arrive at race day fresh and fast. Our AI crafts the ideal taper
                based on your training load and race goals.
              </p>
            </Card>

            <Card className="p-8 border border-muted bg-background dark:bg-background shadow-xl transition-all duration-300 hover:shadow-2xl">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--brand-purple)] to-[var(--brand-blue)] rounded-lg flex items-center justify-center mb-6 ring-2 ring-white dark:ring-white">
                <Award className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Proven Science</h3>
              <p className="text-muted-foreground">
                Built on Jack Daniels&apos; VDOT formula and modern training
                science. Trust in methods that have created champions.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-background dark:bg-background backdrop-blur-sm text-foreground relative overflow-hidden">
        <div className="w-full px-4 sm:px-6 lg:px-8 relative">
          <div className="w-full text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Ready to Rewrite Your Running Story?
            </h2>
            <p className="text-xl mb-8">
              Join the thousands of runners who&apos;ve discovered what&apos;s
              possible when science meets personalization. Your breakthrough is
              waiting.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-[var(--brand-from)] text-white hover:bg-[var(--brand-to)] text-lg px-8 py-6 transition-all duration-200"
                >
                  Start Now
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
              <Link
                href="https://www.youtube.com/watch?v=0_DjDdfqtUE"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="See how Maratron works - demo video"
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6 transition-all duration-200"
                >
                  <PlayCircle className="mr-2 h-5 w-5" aria-hidden="true" />
                  See How It Works
                </Button>
              </Link>
            </div>
            <p className="text-sm mt-6 opacity-75">
              Free to get started. No commitment, just results.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}