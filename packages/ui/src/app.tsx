import { useEffect, useState } from "preact/hooks"
import type { SymbolItem } from "./types";
import Modules from "./components/Modules";
import "./app.css";

export function App() {
  const [symbols, setSymbols] = useState<SymbolItem[]>([]);

  useEffect(() => {
    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.type === 'symbols') {
        setSymbols(message.data);
      }
    });
  }, []);

  return (
    <main>
      <Modules symbols={symbols} />
    </main>
  )
}
