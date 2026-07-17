import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

// Code-split the pages so navigating shows the Name.gif loader while the
// route chunk loads (and keeps the initial bundle smaller).
const Index = lazy(() => import("./pages/Index"));
const Contact = lazy(() => import("./pages/Contact"));
const Experience = lazy(() => import("./pages/Experience"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Cursor trials — swap between QuantumCursor / EnergyOrbCursor / NeuralCursor / CustomCursor.
import QuantumCursor from "@/components/QuantumCursor";
import AnimatedBackground from "@/components/AnimatedBackground";
import ChatBot from "@/components/ChatBot";
import PageLoader from "@/components/PageLoader";
// Scrollbar trials — swap between OrbitScrollbar / AIScrollbar.
import OrbitScrollbar from "@/components/OrbitScrollbar";

// Scrolls to a #hash section after navigation (waits for the animated page
// to mount), or to the top on a plain page change.
function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    const id = decodeURIComponent(hash.replace("#", ""));
    let tries = 0;
    let timer: number;

    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (tries < 25) {
        tries++;
        timer = window.setTimeout(tryScroll, 100);
      }
    };

    // give the page-transition animation time to mount the new page
    timer = window.setTimeout(tryScroll, 400);
    return () => window.clearTimeout(timer);
  }, [pathname, hash]);

  return null;
}

// Smooth fade + slide transition between pages
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -18 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route path="/" element={<Index />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/experience" element={<Experience />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  const { pathname } = useLocation();
  const [routeLoading, setRouteLoading] = useState(true);

  // Show the Name.gif loader briefly on EVERY page open (and initial load),
  // then reveal the page. Short + fast so it never feels sluggish.
  useEffect(() => {
    setRouteLoading(true);
    const t = window.setTimeout(() => setRouteLoading(false), 550);
    return () => window.clearTimeout(t);
  }, [pathname]);

  return (
    <>
      {/* Flowing dark gradient background behind everything */}
      <AnimatedBackground />

      {/* Custom cursor overlays the whole app (quantum trial) */}
      <QuantumCursor />

      {/* Orbit scrollbar — planet thumb + rotating moon (native bar hidden) */}
      <OrbitScrollbar />

      {/* Handles #hash scrolling + scroll-to-top on navigation */}
      <ScrollToHash />

      <AnimatedRoutes />

      {/* Per-page processing loader (glass blur + fast Name.gif) */}
      <AnimatePresence>{routeLoading && <PageLoader key="route-loader" />}</AnimatePresence>

      {/* Mascot chatbot — click the mascot to ask about Praveen */}
      <ChatBot />
    </>
  );
}

export default App;
