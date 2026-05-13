import { useState } from "react";
import { createRoot } from "react-dom/client";
import { BootScreen } from "./boot/BootScreen";
import { App } from "./App";
import "./index.css";

function Root() {
  const [booted, setBooted] = useState(false);

  if (!booted) {
    return <BootScreen onComplete={() => setBooted(true)} />;
  }

  return <App />;
}

const el = document.getElementById("root");
if (!el) throw new Error("Missing #root");

createRoot(el).render(<Root />);
