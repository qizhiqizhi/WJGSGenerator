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
function TSgetset(document: vscode.TextDocument, prop: string, propertyType: string ,classname:string, hasGetter:boolean,hasSetter:boolean) {
    const camelCasePropertyName = capitalizeFirstLetter(prop);
    prop = prop.startsWith('_') ? prop.substring(1) : prop;
    const analyzer = new ClassAnalyzer(document);
    const judge = analyzer.judgeExistence(classname, camelCasePropertyName, hasGetter, hasSetter);
    
    //返回0代表get、set函数均已生成，返回1代表get函数已生成，返回2代表get函数已生成
    if(judge === 0)return '';
    else if(judge === 1) {
        return ` 
\tset ${prop}(value: ${propertyType}) {  
\t\tthis._${prop} = value;  
\t}  `;
    }
    else if(judge === 2) {
        return `
\tget ${prop}(): ${propertyType} {  
\t\treturn this._${prop};  
\t}  `;
    }
    return `
\tget ${prop}(): ${propertyType} {  
\t\treturn this._${prop};  
\t}  
\tset ${prop}(value: ${propertyType}) {  
\t\tthis._${prop} = value;  
\t}  `;
}
// 生成 JS 的get 和 set 的函数，同时判断函数是否已存在
function JSgetset(document: vscode.TextDocument, prop: string, classname:string, hasGetter:boolean,hasSetter:boolean) {
    const analyzer = new ClassAnalyzer(document);
    const name = prop.startsWith('#') ? prop.substring(1) : prop;
    const propertyName = prop.startsWith('#') ? prop : `_${name}`;
    // const name = prop.startsWith('#') ? prop.substring(1) : prop;
    const judge = analyzer.judgeExistence(classname, prop, hasGetter, hasSetter);
    //返回0代表get、set函数均已生成，返回1代表get函数已生成，返回2代表set函数已生成
    if(judge === 0)return '';
    else if(judge === 2){
        return `
\tget ${name}() {  
\t\t return this.${propertyName};  
\t}  `;}
    else if(judge === 1){
        return ` 
\t set ${name}(value) {  
\t\t this.${propertyName} = value;  
\t}  `;
        } 
    return `
\tget ${name}() {  
\t\t return this.${propertyName};  
\t}  
\tset ${name}(value) {  
\t\t this.${propertyName} = value;  
\t}  `;
}
// 生成属性的get或set函数
function getsetfinal(document: vscode.TextDocument,isNonStandard:number, prop: string, propertyType: string ,classname:string, hasGetter:boolean,hasSetter:boolean) {
    const isTS = isTypeScript(document);
    let getterSetter ='';
    if (isTS) {    
        if (isNonStandard == 1) {
            vscode.window.showErrorMessage(`No access modifier is written for : ${prop} .`);
            return '-1';
        }else if(isNonStandard == 2){
            vscode.window.showErrorMessage(`Property '${prop}' should start with an underscore.`);
            return '-1';
        }
        getterSetter = TSgetset(document, prop, propertyType, classname, hasGetter, hasSetter);
    } else { 
        getterSetter = JSgetset(document, prop, classname, hasGetter, hasSetter);
    }  
    return getterSetter;
}
export {capitalizeFirstLetter, isTypeScript, getIndentationLevel,JSgetset, TSgetset, getsetfinal}