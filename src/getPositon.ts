import { Picker } from './picker';
import { TsFileParser } from './tsFileParser';
import * as vscode from 'vscode';

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
