import { Routes, Route } from "react-router-dom";
import Index from "./Pages/Index";       
import About from "./Pages/Contact";
import Projects from "./Pages/Experience";
import NotFound from "./Pages/NotFound";

function App() {
  return (
    <Routes>
      {/* ✅ Default home route */}
      <Route path="/" element={<Index />} />

      {/* ✅ Other pages */}
      <Route path="/about" element={<About />} />
      <Route path="/projects" element={<Projects />} />

      {/* ✅ Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
