import * as vscode from 'vscode';
import {ASTUtil} from './ASTUtil';
import {getLastPropertyPosition} from './getPositon';
import { Project, SyntaxKind } from "ts-morph";

function capitalizeFirstLetter(str:string): string {  
    if (!str || str.length === 0) return str;  
    return str.charAt(0).toUpperCase() + str.slice(1);  
}  
function getTypeFromComment(lineText: string): string | null {  
    const typeMatch = lineText.match(/:\s*(\w+)/);  
    return typeMatch ? typeMatch[1] : null;  
}  
function isTypeScript(document: vscode.TextDocument): boolean {  
    return document.languageId === 'typescript';  
}
function getIndentationLevel(lineText:string) {  
    // 匹配前导空格或制表符  
    const match = lineText.match(/^([\s\t]*)/);  
    return match ? match[0] : '';  
}  
function getMemberName(document: vscode.TextDocument, selection: vscode.Selection): string {
    const selectedText = document.getText(selection);
    const propertyName = selectedText.trim();
    return propertyName;
}
function getAccessModifier(lineText: string): string | null{
    const accessModifiers = ['public', 'private', 'protected'];
    const modifierRegex = new RegExp(`\\b(${accessModifiers.join('|')})\\b`, 'g');
    const match = lineText.match(modifierRegex);
    return match ? match[0] : null;
}

function GSGgenerat(editor: vscode.TextEditor, document: vscode.TextDocument, selection: vscode.Selection): string {
    const selectedText = document.getText(selection);
    const propertyName = selectedText.trim();
    const camelCasePropertyName = capitalizeFirstLetter(propertyName);  
    //拿到属性所在行代码，获得属性的类型（此处受换行影响！）
    const lineText = document.lineAt(selection.end.line).text;  
    const propertyType = getTypeFromComment(lineText);   
    const accessModifier = getAccessModifier(lineText); 
    let getterSetter: string;  
    if (!accessModifier) {
        vscode.window.showErrorMessage('No access modifier is written for the variable.');
        return '';
    }
    const isTS = isTypeScript(document);
    if (isTS) {  
        getterSetter = `  
            get get${camelCasePropertyName}(): ${propertyType} {  
                return this.${propertyName};  
            }  
  
            set set${camelCasePropertyName}(value: ${propertyType}) {  
                this.${propertyName} = value;  
            }  
        `;  
    } else { 
        getterSetter = `  
            get get${camelCasePropertyName}() {  
                return this.${propertyName};  
            }  
  
            set set${camelCasePropertyName}(value) {  
                this.${propertyName} = value;  
            }  
        `;  
    }  
    return getterSetter;
}

function GSGenerateCommand() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No editor is active.');
        return;
    }

    const document = editor.document;
    const selection = editor.selection;
    if (selection.isEmpty) {
        vscode.window.showErrorMessage('No selection. Please select a property name.');
        return;
    }
  
    const currentLineText = document.lineAt(selection.end.line).text;  
    // 获取当前行的缩进级别  
    const indentation = getIndentationLevel(currentLineText);
    const MemberName = getMemberName(document, selection)
    
    const getSetCode = GSGgenerat(editor, document, selection).replace(/^\s*/gm, indentation);
    const memberInfo = ASTUtil.getMemberInfo(editor.document.fileName, MemberName);

    if (!memberInfo) {
        vscode.window.showErrorMessage('Member not found.');
        return;
    }
    if (!getSetCode) return; 

    const lastPropertyPosition = getLastPropertyPosition(document, selection);
    const positionEnd = new vscode.Position(lastPropertyPosition + 1, 0);
    editor.edit(editBuilder => {
        editBuilder.insert(positionEnd, `\n${getSetCode}\n`);
    }).then(success => {
        if (!success) {
            vscode.window.showErrorMessage('Failed to insert getter and setter methods.');
        }
    });
     
}
// 激活函数
function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.generateGetterSetter', GSGenerateCommand);
    context.subscriptions.push(disposable);
}
// 停用函数
function deactivate() {}

export { activate, deactivate };