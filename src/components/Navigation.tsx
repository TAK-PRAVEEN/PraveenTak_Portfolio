import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Experience", path: "/experience" },
    { name: "Contact", path: "/contact" },
  ];

  const linkVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  const containerVariants = {
    hidden: { x: "100%", opacity: 0 },
    visible: {
      x: "0%",
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.15,
      },
    },
    exit: { x: "100%", opacity: 0, transition: { duration: 0.3 } },
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-background/70 backdrop-blur-md shadow-md">
      <div className="container mx-auto flex justify-between items-center px-6 py-4">
        {/* Logo + GIF */}
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/favicon.png"
            alt="logo"
            className="w-8 h-8 rounded-full"
          />
          <span className="font-bold text-lg text-primary">Praveen Tak</span>
          <img
            src="/my-cool.gif"
            alt="animated gif"
            className="w-10 h-10"
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex space-x-6 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`hover:text-primary transition-colors ${
                location.pathname === link.path
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {link.name}
            </Link>
          ))}

          {/* Social Icons */}
          <div className="flex items-center gap-4 ml-6">
            <a href="https://github.com/TAK-PRAVEEN" target="_blank" rel="noopener noreferrer">
              <img src="/github.svg" alt="GitHub" className="w-6 h-6 hover:opacity-80" />
            </a>
            <a href="https://www.linkedin.com/in/praveentak" target="_blank" rel="noopener noreferrer">
              <img src="/linkedin.svg" alt="LinkedIn" className="w-6 h-6 hover:opacity-80" />
            </a>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Sidebar with Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <motion.div
              key="sidebar"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={containerVariants}
              className="fixed top-0 right-0 h-full w-3/4 max-w-xs bg-background/95 backdrop-blur-lg shadow-xl z-50 flex flex-col items-center justify-center space-y-6"
            >
              {navLinks.map((link) => (
                <motion.div key={link.path} variants={linkVariants}>
                  <Link
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`text-xl transition-all duration-300 ${
                      location.pathname === link.path
                        ? "text-primary font-semibold"
                        : "text-muted-foreground"
                    } hover:text-primary hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]`}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}

              {/* Social Icons inside sidebar too */}
              <div className="flex gap-6 mt-8">
                <a href="https://github.com/TAK-PRAVEEN" target="_blank" rel="noopener noreferrer">
                  <img src="/github.svg" alt="GitHub" className="w-7 h-7 hover:opacity-80" />
                </a>
                <a href="https://www.linkedin.com/in/praveentak" target="_blank" rel="noopener noreferrer">
                  <img src="/linkedin.svg" alt="LinkedIn" className="w-7 h-7 hover:opacity-80" />
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navigation;
