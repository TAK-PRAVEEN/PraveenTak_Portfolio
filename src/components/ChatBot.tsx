import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, MessageCircle } from "lucide-react";
import {
  KNOWLEDGE,
  GREETING,
  FALLBACK,
  SUGGESTIONS,
} from "@/data/chatbotKnowledge";

const MASCOT_SRC = `${import.meta.env.BASE_URL}mascot.png`;

interface ChatMessage {
  role: "bot" | "user";
  text: string;
}

// Lightweight keyword matcher — picks the best-scoring knowledge entry.
function findAnswer(raw: string): string {
  const text = raw.toLowerCase().replace(/[^\w\s]/g, " ");
  const words = new Set(text.split(/\s+/).filter(Boolean));

  if (/\b(hi|hello|hey|yo|hola|namaste)\b/.test(text)) return GREETING;
  if (/\b(thanks|thank you|thx|cool|nice|great)\b/.test(text))
    return "Glad to help! 😄 Anything else you'd like to know about Praveen?";
  if (/\b(bye|goodbye|see you|cya)\b/.test(text))
    return "Take care! 👋 Feel free to reach out through the Contact page.";

  let best: { score: number; answer: string } | null = null;
  for (const entry of KNOWLEDGE) {
    let score = 0;
    for (const kw of entry.keywords) {
      // Multi-word keywords are matched as a phrase; single words must match
      // a whole word (so "cat" doesn't match "eduCATion").
      const hit = kw.includes(" ") ? text.includes(kw) : words.has(kw);
      if (hit) score += kw.length; // longer match = stronger signal
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { score, answer: entry.answer };
    }
  }
  return best ? best.answer : FALLBACK;
}

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "bot", text: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, open]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setTyping(true);
    // small delay so the reply feels natural
    window.setTimeout(() => {
      const answer = findAnswer(trimmed);
      setMessages((prev) => [...prev, { role: "bot", text: answer }]);
      setTyping(false);
    }, 550);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* ---------- Chat panel ---------- */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-24 right-4 z-[45] flex h-[28rem] max-h-[70vh] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-primary/30 bg-card/80 shadow-2xl backdrop-blur-xl sm:w-96"
          >
            {/* header */}
            <div className="flex items-center gap-3 border-b border-border/50 bg-primary/10 px-4 py-3">
              <img
                src={MASCOT_SRC}
                alt="Praveen's avatar"
                className="h-9 w-9 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  Ask about Praveen
                </p>
                <p className="text-xs text-muted-foreground">
                  Powered by his mini-bot 🤖
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-full p-1.5 text-muted-foreground hover:bg-background/50 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* messages */}
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-background/70 text-foreground"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {typing && (
                <div className="flex justify-start">
                  <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-background/70 px-3 py-3">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                        style={{ animationDelay: `${d * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* suggestion chips (only before the user has asked anything) */}
              {messages.length <= 1 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs text-foreground transition-colors hover:bg-primary/15"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <div ref={endRef} />
            </div>

            {/* input */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 border-t border-border/50 p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about Praveen..."
                className="flex-1 rounded-full border border-border/60 bg-background/60 px-4 py-2 text-sm text-foreground outline-none focus:border-primary/60"
              />
              <button
                type="submit"
                aria-label="Send"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Launcher (mascot) ---------- */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        aria-label="Chat with Praveen's bot"
        className="fixed bottom-4 right-4 z-[45] flex flex-col items-center"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 120, damping: 14 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.92 }}
      >
        {/* hint bubble */}
        <AnimatePresence>
          {!open && (
            <motion.span
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-1 hidden rounded-full border border-primary/30 bg-card/80 px-2.5 py-1 text-[10px] text-foreground shadow backdrop-blur-md sm:block"
            >
              Ask me about Praveen!
            </motion.span>
          )}
        </AnimatePresence>

        <span className="relative">
          <span className="absolute inset-0 m-auto h-3/4 w-3/4 rounded-full bg-primary/30 blur-2xl" />
          <motion.img
            src={MASCOT_SRC}
            alt="Chat with Praveen's bot"
            className="relative w-16 drop-shadow-xl sm:w-20 md:w-24"
            draggable={false}
            animate={open ? { y: 0 } : { y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: open ? 0 : Infinity, ease: "easeInOut" }}
          />
          {/* little chat indicator */}
          <span className="absolute -right-0 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
            <MessageCircle className="h-3 w-3" />
          </span>
        </span>
      </motion.button>
    </>
  );
};

export default ChatBot;
