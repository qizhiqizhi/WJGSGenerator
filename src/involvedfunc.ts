import * as vscode from 'vscode';
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
export {capitalizeFirstLetter, getTypeFromComment, isTypeScript, getIndentationLevel, getMemberName, getAccessModifier}