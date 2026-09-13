import * as vscode from "vscode";

export interface IBaseHandler {
  getSymbolKindLabel(kind: vscode.SymbolKind): string;
  getSymbolKindOrder(): string[];
}
