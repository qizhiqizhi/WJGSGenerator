// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as ts from 'typescript';
import {ASTUtil} from './ASTUtil';
import { Project, SyntaxKind } from "ts-morph";

function capitalizeFirstLetter(str:string): string {  
    if (!str || str.length === 0) return str;  
    return str.charAt(0).toUpperCase() + str.slice(1);  
}  
function getTypeFromComment(lineText: string): string | null {  
    const typeMatch = lineText.match(/:\s*(\w+)/);  
    return typeMatch ? typeMatch[1] : null;  
}  
function isTypeScriptDocument(document: vscode.TextDocument): boolean {  
    return document.languageId === 'typescript';  
}
function getClassposition(document:vscode.TextDocument, selection: vscode.Selection): number {
    const selectedText = document.getText(selection);
    //除前后空白
    const propertyName = selectedText.trim();
    const matchedProperty = ASTUtil.memberInfos.properties.find(propertyInfo => propertyInfo.name === propertyName);
    if (matchedProperty) {
        // 查找包含该属性的类的结束行号
        const classEndRow = ASTUtil.memberInfos.classes.reduce((prevEndRow, classInfo) => {
          if (matchedProperty.startRow >= classInfo.startRow && matchedProperty.startRow <= classInfo.endRow) {
            return classInfo.endRow;
          }
          // 否则返回之前找到的最大行号
          return prevEndRow;
        }, -1);  
        if (classEndRow !== -1) {
          return classEndRow;
        }
        else return -1;
      }
      else return -1;
}
function GSGgenerat(editor: vscode.TextEditor, document: vscode.TextDocument, selection: vscode.Selection): string {
    const selectedText = document.getText(selection);
    const propertyName = selectedText.trim();
    const camelCasePropertyName = capitalizeFirstLetter(propertyName);  
    //拿到属性所在行代码，获得属性的类型（此处受换行影响！）
    const lineText = document.lineAt(selection.end.line).text;  
    const propertyType = getTypeFromComment(lineText);    
    let getterSetter: string;  
    const isTypeScript = isTypeScriptDocument(document);
    if (isTypeScript) {  
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
    ASTUtil.getMemberInfo(editor.document.fileName,MemberName)
    const getSetCode = GSGgenerat(editor, document, selection).replace(/^\s*/gm, indentation);
    const memberInfo = ASTUtil.getMemberInfo(editor.document.fileName, MemberName);
    console.log(ASTUtil.memberInfos.classes);
    
    if (!memberInfo) {
        vscode.window.showErrorMessage('Member not found.');
        return;
    }
    editor.edit(editBuilder => {
        const popision = getClassposition(document, selection);
        const positionAfterClass = new vscode.Position(popision - 1, 0);
        editBuilder.insert(positionAfterClass, `\n${getSetCode}\n`);
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