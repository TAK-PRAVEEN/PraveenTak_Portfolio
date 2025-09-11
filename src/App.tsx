import { Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Contact from "./pages/Contact";
import Experience from "./pages/Experience";
import NotFound from "./pages/NotFound";
import CustomCursor from "@/components/CustomCursor";

function App() {
  return (
    <>
      {/* Custom cursor overlays the whole app */}
      <CustomCursor />

      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/experience" element={<Experience />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
