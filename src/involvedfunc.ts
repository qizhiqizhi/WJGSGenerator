import * as vscode from 'vscode';
import { ClassAnalyzer } from './getInformation';

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
    const analyzer = new ClassAnalyzer(document);
    const judge = analyzer.judgeExistence(classname, camelCasePropertyName);
    //返回0代表get、set函数均已生成，返回1代表get函数已生成，返回2代表get函数已生成
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
    const analyzer = new ClassAnalyzer(document);
    const judge = analyzer.judgeExistence(classname, camelCasePropertyName);
    //返回0代表get、set函数均已生成，返回1代表get函数已生成，返回2代表get函数已生成
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
// 生成属性的get或set函数
function getsetfinal(document: vscode.TextDocument,isWithoutModifiers:boolean, prop: string, propertyType: string ,classname:string) {
    const isTS = isTypeScript(document);
    let getterSetter ='';
    if (isTS) {    
        if (isWithoutModifiers) {
            vscode.window.showErrorMessage(`No access modifier is written for : ${prop} .`);
            return '-1';
        }
        getterSetter = TSgetset(document, prop, propertyType, classname);
    } else { 
        getterSetter = JSgetset(document, prop, classname);
    }  
    return getterSetter;
}
export {capitalizeFirstLetter, isTypeScript, getIndentationLevel,JSgetset, TSgetset, getsetfinal}