// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { CodeOverviewProvider } from './codeOverview.js';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const codeOverview = vscode.window.registerWebviewViewProvider('codeOverview', new CodeOverviewProvider(context.extensionUri, context));

	context.subscriptions.push(codeOverview);
}

// This method is called when your extension is deactivated
export function deactivate() { }
