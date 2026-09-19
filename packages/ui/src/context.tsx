import { createContext } from "preact";
import type { ReactNode } from "preact/compat";
import { useContext } from "preact/hooks";

declare global {
  const acquireVsCodeApi: () => {
    postMessage: (...args: any[]) => void
  }
}

const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : {
  // @ts-ignore
  postMessage: (...args: any[]) => { }
}

const context = createContext(vscode);

export const useVscodeContext = () => {
  const vscode = useContext(context);

  return vscode;
}

export const VScodeWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <context.Provider value={vscode}>
      {children}
    </context.Provider>
  )
}