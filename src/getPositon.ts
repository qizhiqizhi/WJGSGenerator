import { Picker } from './picker';
import { TsFileParser } from './tsFileParser';
import { ClassDeclaration, FunctionDeclaration, MethodDeclaration, Project, ts, PropertyDeclaration, SourceFile } from "ts-morph";
import * as vscode from 'vscode';

export function getLastPropertyPosition(document:vscode.TextDocument, selection: vscode.Selection): number {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No editor is active.');
      return -1;
    }
    const { fileName, wordText, lineNumber } = new Picker(editor).pick(); 
    const sourceFile = TsFileParser.parse(fileName);
    const selectedText = document.getText(selection);
    const propertyName = selectedText.trim();
    let result = 0;
    let flag = 0 ;
    let className: string | undefined;
    let Truename: string | undefined;
    sourceFile.getClasses().forEach((classDecl) => {
      className = classDecl.getName();
      classDecl.getProperties().forEach((ProDecl) =>{
        if (ProDecl.getName() === propertyName) {
          result = ProDecl.getEndLineNumber();
          Truename = classDecl.getName();
          flag = 1;
        }
        if(className === Truename && flag ===1){
          result = ProDecl.getEndLineNumber();
          console.log(result);
          
        }
      })
    });
    return result;
    // return 4;
}
