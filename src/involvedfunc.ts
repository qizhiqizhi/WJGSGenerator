import * as vscode from 'vscode';
import { judgeExi } from './getPositon';
//首字母大写
function capitalizeFirstLetter(str:string): string {  
    if (!str || str.length === 0) return str;  
    return str.charAt(0).toUpperCase() + str.slice(1);    
}  
//判断类型是否为TS
function isTypeScript(document: vscode.TextDocument): boolean {  
    return document.languageId === 'typescript';  
}
//获取缩进位置
function getIndentationLevel(lineText:string) {  
    // 匹配前导空格或制表符  
    const match = lineText.match(/^([\s\t]*)/);  
    return match ? match[0] : '';  
}  
// 生成 TS 的get 和 set 的函数，同时判断函数是否已存在
function TSgetset(document: vscode.TextDocument, prop: string, propertyType: string ,classname:string) {
    const camelCasePropertyName = capitalizeFirstLetter(prop);
    const judge = judgeExi(document, classname, camelCasePropertyName);
    
    if(judge === 0)return '';
    else if(judge === 1) {
        return ` 
\tpublic set${camelCasePropertyName}(value: ${propertyType}) {  
\t\tthis.${prop} = value;  
\t}  `;
    }
    else if(judge === 2) {
        return `
\tpublic get${camelCasePropertyName}(): ${propertyType} {  
\t\treturn this.${prop};  
\t}  `;
    }
    return `
\tpublic get${camelCasePropertyName}(): ${propertyType} {  
\t\treturn this.${prop};  
\t}  
\tpublic set${camelCasePropertyName}(value: ${propertyType}) {  
\t\tthis.${prop} = value;  
\t}  `;
}
// 生成 JS 的get 和 set 的函数，同时判断函数是否已存在
function JSgetset(document: vscode.TextDocument, prop: string, classname:string) {
    const camelCasePropertyName = capitalizeFirstLetter(prop);
    const judge = judgeExi(document, classname, camelCasePropertyName);
    if(judge === 0)return '';
    else if(judge === 2){
        return `
\tget${camelCasePropertyName}() {  
\t\t return this.${prop};  
\t}  `;}
    else if(judge === 1){
        return ` 
\tset${camelCasePropertyName}(value) {  
\t\t this.${prop} = value;  
\t}  `;
        } 
    return `
\tget${camelCasePropertyName}() {  
\t\t return this.${prop};  
\t}  
\tset${camelCasePropertyName}(value) {  
\t\t this.${prop} = value;  
\t}  `;
}
export {capitalizeFirstLetter, isTypeScript, getIndentationLevel,JSgetset, TSgetset}