import { useEffect, useState } from "preact/hooks"
import type { SymbolItem } from "./types";
import Modules from "./components/Modules";
import "./app.css";
import { useVscodeContext } from "./context";

export function App() {
  const [symbols, setSymbols] = useState<SymbolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const vscode = useVscodeContext();

  useEffect(() => {
    vscode.postMessage({ command: 'requestSymbols' });
    // @ts-ignore 
    const handler = (event) => {
      const message = event.data;
      if (message.type === 'symbols') {
        setSymbols(message.data);
        setLoading(false);
      }
    }

    window.addEventListener('message', handler);
    return () => {
      window.removeEventListener('message', handler);
    }
  }, []);

  if (!loading && !symbols?.length) {
    return <span>Not found more symbols.</span>
  }

  return (
    <Modules symbols={symbols} />
  )
}
