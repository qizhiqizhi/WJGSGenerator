import { Picker } from './picker';
import { TsFileParser } from './tsFileParser';
import { ClassDeclaration, FunctionDeclaration, MethodDeclaration, Project, ts, PropertyDeclaration, SourceFile, Type, Node } from "ts-morph";
import * as vscode from 'vscode';

interface ClassInfo {
  name: string;
  Position: number;
  properties: string[];
  protypes: string[];
  isWithoutModifiers: boolean[];
}
//获取类中最后一个属性的位置
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
//获取类中属性的访问修饰符
function getlimit(propDecl: PropertyDeclaration): string[]{
  const modifiers = propDecl.getModifiers().map((modifier: { getKind: () => any; }) => {
    switch (modifier.getKind()) {
        case ts.SyntaxKind.PublicKeyword:
            return "public";
        case ts.SyntaxKind.PrivateKeyword:
            return "private";
        case ts.SyntaxKind.ProtectedKeyword:
            return "protected";
        default:
            return ""; // 如果不需要未知修饰符，可以返回空字符串或忽略
      }
  }).filter((mod: string) => mod !== ""); // 移除空字符串
  return modifiers;
}
//获取文件中所有属性的基础信息
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
        protypes: [],
        isWithoutModifiers: []
      };
      classDecl.getProperties().forEach((propDecl, index) => {
        const propName = propDecl.getName();
        const propType = propDecl.getType().getText();
        const modifiers = getlimit(propDecl);
        classInfo.isWithoutModifiers.push(modifiers.length <= 0 ? true : false);

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
//判断该函数是否已存在
export function judgeExi(document:vscode.TextDocument, classname: string, methodname: string): boolean {
  const fileName = document.fileName;
  const sourceFile = TsFileParser.parse(fileName);
  const classDecls = sourceFile.getClasses();
    for (const classDecl of classDecls) {
        if (classDecl.getName() === classname) {
            const methods = classDecl.getMethods();
            for (const methodDecl of methods) {
                if (methodDecl.getName() === methodname) {
                    return true; 
                }
            }
        }
    }
  return false;
}