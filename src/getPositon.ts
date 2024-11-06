import { Picker } from './picker';
import { TsFileParser } from './tsFileParser';
import { ClassDeclaration, FunctionDeclaration, MethodDeclaration, Project, ts, PropertyDeclaration, SourceFile, Type } from "ts-morph";
import * as vscode from 'vscode';

interface ClassInfo {
  name: string;
  Position: number;
  properties: string[];
  protypes: string[];
}
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
    let TrueName: string | undefined;
    sourceFile.getClasses().forEach((classDecl) => {
      className = classDecl.getName();
      classDecl.getProperties().forEach((ProDecl) =>{
        const name = ProDecl.getName();
        // 检查属性名是否以#开头，如果是则去掉#
        const trimmedName = name.startsWith('#') ? name.substring(1) : name;
        
        if (trimmedName === propertyName) {
          result = ProDecl.getEndLineNumber();
          TrueName = classDecl.getName();
          flag = 1;
        }
        if(className === TrueName && flag ===1){
          result = ProDecl.getEndLineNumber();
        }
      })
    });
    return result;
}
export function getPropertyPosition(document:vscode.TextDocument): ClassInfo[] {
  const fileName = document.fileName;
  const sourceFile = TsFileParser.parse(fileName);
  const classList: ClassInfo[] = [];
  sourceFile.getClasses().forEach((classDecl) => {
    const className = classDecl.getName();
    if (className) {
      const classInfo: ClassInfo = {
        name: className,
        Position: 0,
        properties: [],
        protypes: []
      };
      classDecl.getProperties().forEach((propDecl, index) => {
        const propName = propDecl.getName();
        const propType = propDecl.getType().getText();
        console.log(propType);
        
        const trimmedName = propName.startsWith('#') ? propName.substring(1) : propName;
        classInfo.properties.push(trimmedName);
        classInfo.protypes.push(propType);
        if (index === classDecl.getProperties().length - 1) {
          classInfo.Position = propDecl.getEndLineNumber();
        }
      });
      classList.push(classInfo);
    }
  });
  return classList;
}