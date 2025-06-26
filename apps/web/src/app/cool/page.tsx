"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@components/Navbar";
import Footer from "@components/Footer";

export default function LandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrubContainerRef = useRef<HTMLDivElement>(null);
  const videoDurationRef = useRef<number>(0);

  useEffect(() => {
    const videoEl = videoRef.current;
    const container = scrubContainerRef.current;
    if (!videoEl || !container) return;

    // ==============
    //  Scroll‐scrub logic
    // ==============
    const START_THRESHOLD = 0.1; // begin scrubbing at 10%

    const handleScroll = () => {
      const rect = container.getBoundingClientRect();
      const vh = window.innerHeight;

      // If container is fully off‐screen, bail out
      if (rect.bottom < 0 || rect.top > vh) {
        return;
      }

      const totalScrollRange = rect.height + vh;
      // How far inside the container have we scrolled?
      const scrollInside = Math.min(
        Math.max(vh - rect.top, 0),
        totalScrollRange
      );

      const rawFraction = scrollInside / totalScrollRange;

      if (rawFraction < START_THRESHOLD) {
        videoEl.currentTime = 0;
      } else {
        // Map [0.1 … 1] → [0 … 1]
        const adjFraction =
          (rawFraction - START_THRESHOLD) / (1 - START_THRESHOLD);
        videoEl.currentTime = adjFraction * videoDurationRef.current;
      }
    };

    // ==============
    //  Metadata handler
    // ==============
    const onLoadedMetadata = () => {
      videoDurationRef.current = videoEl.duration || 0;
      // If we’re already scrolled, scrub immediately
      handleScroll();
    };

    // Attach listener
    videoEl.addEventListener("loadedmetadata", onLoadedMetadata);

    // If metadata is already available (readyState ≥ HAVE_METADATA), call handler immediately
    if (videoEl.readyState >= 1) {
      onLoadedMetadata();
    } else {
      // Force the browser to start loading/metadata if it hasn't yet
      videoEl.load();
    }

    // Attach scroll listener
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Also run once on mount, in case user is already scrolled past 10%
    handleScroll();

    return () => {
      videoEl.removeEventListener("loadedmetadata", onLoadedMetadata);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []); // run only once on mount

  return (
    <main className="relative overflow-x-hidden text-foreground bg-transparent">
      <Navbar />

      {/* Full‐screen background video */}
      <video
        ref={videoRef}
        src="/landing-video.mp4"
        muted
        playsInline
        preload="auto"
        className="pointer-events-none fixed inset-0 w-full h-full object-cover z-0"
      />
      <div className="fixed inset-0 bg-black opacity-50 z-10 pointer-events-none" />

      <div
        ref={scrubContainerRef}
        id="video-scrub"
        className="relative w-full"
        style={{ height: "500vh" }} /* adjust as needed */
      >
        <div className="relative z-10 min-h-screen flex flex-col justify-center items-center text-center pt-16 px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Image
              src="/logo-full.svg"
              alt="Maratron Logo"
              width={200}
              height={200}
              className="mb-6"
              priority
            />
            <h1 className="text-5xl sm:text-7xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              The AI Coach for Serious Runners
            </h1>
            <p className="mt-6 text-lg text-foreground opacity-70">
              Maratron helps you train smarter, race faster, and stay
              injury-free with cutting-edge tech.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="px-6 py-3 text-white font-semibold bg-primary rounded-md hover:bg-primary hover:opacity-90 transition"
              >
                Get Started
              </Link>
              <a
                href="#features"
                className="px-6 py-3 text-primary border border-primary rounded-md hover:bg-primary hover:opacity-10 transition"
              >
                Learn More
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      <section
        id="features"
        className="py-24 px-4 sm:px-6 bg-accent opacity-5 relative z-10"
      >
        <div className="w-full text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12">
            Built for Performance and Progress
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">{/* … */}</div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
