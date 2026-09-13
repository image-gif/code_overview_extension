import type { SymbolItem } from "../../types";
import ModuleItem from "../ModuleItem";
import "./index.css";

export default function Modules({ symbols }: { symbols: SymbolItem[] }) {
  return (
    <ul className="code-overview-wrapper">
      {
        symbols.map(symbol => (
          <li key={symbol.label}>
            <ModuleItem data={symbol} />
          </li>
        ))
      }
    </ul>
  )
}