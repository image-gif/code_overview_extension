import * as vscode from 'vscode';
import * as fs from 'node:fs';
import { getLanguageHandler } from './utils/handlers';

type DocumentSymbolType = vscode.DocumentSymbol & {
  location: vscode.Location;
};

type ItemLocation = {
  start: {
    line: number;
    character: number;
  };
  end: {
    line: number;
    character: number;
  };
  uri: string;
}

type StructItem = {
  name: string;
  location: ItemLocation;
  kind: vscode.SymbolKind;
  children?: StructData[];
}

type StructData = {
  kinds: vscode.SymbolKind[];
  label: string;
  children: Array<StructItem>;
};

export class CodeOverviewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;

  constructor(private readonly extensionUri: vscode.Uri, context: vscode.ExtensionContext) {

    let debounceTimer: NodeJS.Timeout;
    context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor(() => {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => this.sendSymbols(), 50);
      }),

      vscode.workspace.onDidSaveTextDocument((doc) => {
        if (doc.uri.toString() === vscode.window.activeTextEditor?.document.uri.toString()) {
          this.sendSymbols();
        }
      })
    );
  }

  private async getDocumentSymbols(): Promise<DocumentSymbolType[]> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return [];
    }

    const symbols = await vscode.commands.executeCommand<DocumentSymbolType[]>(
      'vscode.executeDocumentSymbolProvider',
      editor.document.uri
    );

    return symbols || [];
  }

  private generateStructData(symbols: DocumentSymbolType[]): StructData[] {
    const moduleMap: Map<string, StructData> = new Map();
    const languange = vscode.window.activeTextEditor?.document.languageId;

    if (!languange) {
      return [];
    }

    const languageHandler = getLanguageHandler(languange);

    for (const symbol of symbols) {
      const kindLabel = languageHandler.getSymbolKindLabel(symbol.kind);

      if (!moduleMap.has(kindLabel)) {
        moduleMap.set(kindLabel, {
          kinds: [],
          label: kindLabel,
          children: []
        });
      }

      const { kinds, children } = moduleMap.get(kindLabel)!;
      if (kinds.indexOf(symbol.kind) === -1) {
        kinds.push(symbol.kind);
      }

      const location = {
        start: { line: symbol.selectionRange.start.line, character: symbol.selectionRange.start.character },
        end: { line: symbol.selectionRange.end.line, character: symbol.selectionRange.end.character },
        uri: symbol.location.uri.toString(),
      };

      if (symbol.kind === vscode.SymbolKind.Class) {
        const classChildren = this.generateStructData(symbol.children as DocumentSymbolType[]) || [];
        children.push({
          name: symbol.name,
          kind: vscode.SymbolKind.Class,
          location,
          children: classChildren,
        });
      } else {
        children.push({
          name: symbol.name,
          kind: symbol.kind,
          location,
        });
      }
    }

    const result = Array.from(moduleMap);
    const ModuleNames = languageHandler.getSymbolKindOrder();
    result.sort((moduleA, moduleB) => ModuleNames.indexOf(moduleA[0]) - ModuleNames.indexOf(moduleB[0]));
    return result.map(([_, val]: [string, StructData]) => {
      return {
        ...val,
        kinds: [...val.kinds],
      };
    });
  }

  private async sendSymbols() {
    const symbols = await this.getDocumentSymbols();
    const structData = this.generateStructData(symbols);
    this.view?.webview.postMessage({
      type: 'symbols',
      data: structData
    });
  }

  private getHtml(webview: vscode.Webview): Promise<string> {
    // 1. 读取 HTML 模板
    const uiPath = vscode.Uri.joinPath(this.extensionUri, 'out/ui');
    const htmlPath = vscode.Uri.joinPath(uiPath, 'index.html');
    let html = fs.readFileSync(htmlPath.fsPath, 'utf8');

    const matchLinks = /(href|src)="([^"]*)"/g;
    const toUri = (_: string, prefix: 'href' | 'src', link: string) => {
      if (link === '#') {
        return `${prefix}="${link}"`;
      }

      // const _path = path.join(uiPath.fsPath, link);
      // const uri = vscode.Uri.file(_path);
      return `${prefix}="${webview.asWebviewUri(vscode.Uri.joinPath(uiPath, link))}"`;
    };

    html = html.replace(matchLinks, toUri);
    return Promise.resolve(html);
  }

  private async gotoTarget(location: ItemLocation) {
    const uri = vscode.Uri.parse(location.uri);
    const doc = await vscode.workspace.openTextDocument(uri);
    const selection = new vscode.Range(
      location.start.line, location.start.character,
      location.end.line, location.end.character
    );

    await vscode.window.showTextDocument(doc, {
      selection,
      preserveFocus: false,
      viewColumn: vscode.ViewColumn.One  // 可选：指定在哪个编辑器组打开
    });
  }

  async resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    webviewView.webview.html = await this.getHtml(webviewView.webview);

    // 接收 Webview 消息
    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === 'requestSymbols') {
        this.sendSymbols();
      } else if (message.command === 'gotoTarget') {
        await this.gotoTarget(message.location);
      }
    });
  }

}