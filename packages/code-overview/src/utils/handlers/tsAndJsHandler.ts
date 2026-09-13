import * as vscode from "vscode";
import { IBaseHandler } from "./baseHandler";

export class TsAndJsHandler implements IBaseHandler {

  private readonly SymbolKindOrder = [
    'Type',
    'Enum',
    'Variable',
    'Function',
    'Class',
    'Property',
    'Constructor',
    'Method',
    'Others'
  ];

  public getSymbolKindOrder() {
    return this.SymbolKindOrder;
  }

  public getSymbolKindLabel(kind: vscode.SymbolKind) {
    switch (kind) {
      case vscode.SymbolKind.Class:
        return 'Class';
      case vscode.SymbolKind.Property:
      case vscode.SymbolKind.Field:
        return 'Property';
      case vscode.SymbolKind.Constructor:
        return 'Constructor';
      case vscode.SymbolKind.Method:
        return 'Method';
      case vscode.SymbolKind.Function:
        return 'Function';
      case vscode.SymbolKind.Array:
      case vscode.SymbolKind.Boolean:
      case vscode.SymbolKind.Number:
      case vscode.SymbolKind.String:
      case vscode.SymbolKind.Null:
      case vscode.SymbolKind.Object:
      case vscode.SymbolKind.Variable:
      case vscode.SymbolKind.Constant:
        return 'Variable';
      case vscode.SymbolKind.Interface:
        return "Type";
      case vscode.SymbolKind.Enum:
        return "Enum";
      default:
        return 'Others';
    }
  }
}