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
// 判断该函数是否已存在
function judgeExistence(hasGetter:boolean, hasSetter:boolean): number {
    if (hasGetter && hasSetter) {
        return 0;
    } else if (hasGetter) {
        return 1;
    } else if (hasSetter) {
        return 2;
    } else {
        return 3;
    }
}
// 生成 TS 的get 和 set 的函数，同时判断函数是否已存在
function TSgetsetES6(prop: string, propertyType: string , hasGetter:boolean,hasSetter:boolean) {
    // const camelCasePropertyName = capitalizeFirstLetter(prop);
    prop = prop.startsWith('_') ? prop.substring(1) : prop;
    const judge = judgeExistence(hasGetter, hasSetter);
    
    //返回0代表get、set函数均已生成，返回1代表get函数已生成，返回2代表get函数已生成
    if(judge === 0)return '';
    else if(judge === 1) {
        return ` 
\t/**
\t* Setter ${prop}
\t* @param {${propertyType}} value
\t*/
\tset ${prop}(value: ${propertyType}) {  
\t\tthis._${prop} = value;  
\t}  `;
    }
    else if(judge === 2) {
        return `
\t/**
\t* getter ${prop}
\t* @return {${propertyType}}
\t*/
\tget ${prop}(): ${propertyType} {  
\t\treturn this._${prop};  
\t}  `;
    }
    return `
\t/**
\t* getter ${prop}
\t* @return {${propertyType}}
\t*/
\tget ${prop}(): ${propertyType} {  
\t\treturn this._${prop};  
\t}
\t/**
\t* Setter ${prop}
\t* @param {${propertyType}} value
\t*/  
\tset ${prop}(value: ${propertyType}) {  
\t\tthis._${prop} = value;  
\t}  `;
}
// 生成 JS 的get 和 set 的函数，同时判断函数是否已存在
function JSgetsetES6(prop: string, hasGetter:boolean,hasSetter:boolean) {
    const name = prop.startsWith('#') ? prop.substring(1) : prop;
    const propertyName = prop.startsWith('#') ? prop : `_${name}`;
    // const name = prop.startsWith('#') ? prop.substring(1) : prop;
    const judge = judgeExistence(hasGetter, hasSetter);
    //返回0代表get、set函数均已生成，返回1代表get函数已生成，返回2代表set函数已生成
    if(judge === 0)return '';
    else if(judge === 2){
        return `
\t/**
\t* getter ${name}
\t* @return {${name}} value
\t*/
\tget ${name}() {  
\t\t return this.${propertyName};  
\t}  `;}
    else if(judge === 1){
        return ` 
\t/**
\t* Setter ${name}
\t* @param {${name}} value
\t*/
\t set ${name}(value) {  
\t\t this.${propertyName} = value;  
\t}  `;
        } 
    return `
\t/**
\t* getter ${name}
\t* @return {${name}} value
\t*/
\tget ${name}() {  
\t\t return this.${propertyName};  
\t}  
\t/**
\t* Setter ${name}
\t* @param {${name}} value
\t*/
\tset ${name}(value) {  
\t\t this.${propertyName} = value;  
\t}  `;
}
// 生成属性的get或set函数
function getsetfinalES6(isTS: boolean,isNonStandard:number, prop: string, propertyType: string , hasGetter:boolean,hasSetter:boolean) {
    let getterSetter ='';
    if (isTS) {    
        if (isNonStandard == 1) {
            vscode.window.showErrorMessage(`No access modifier is written for : ${prop} .`);
            return '-1';
        }else if(isNonStandard == 2){
            vscode.window.showErrorMessage(`Property '${prop}' should start with an underscore.`);
            return '-1';
        }
        getterSetter = TSgetsetES6(prop, propertyType, hasGetter, hasSetter);
    } else { 
        getterSetter = JSgetsetES6(prop, hasGetter, hasSetter);
    }  
    return getterSetter;
}
// 生成 TS 的get 和 set 的函数，同时判断函数是否已存在
function TSgetset(prop: string, propertyType: string, hasGetter:boolean,hasSetter:boolean) {
    const camelCasePropertyName = capitalizeFirstLetter(prop);
    prop = prop.startsWith('_') ? prop.substring(1) : prop;
    
    // const camelCasePropertyName = capitalizeFirstLetter(prop);
    // const analyzer = new ClassAnalyzer(document);
    // const judge = analyzer.judgeExistence(classname, camelCasePropertyName);
    const judge = judgeExistence(hasGetter, hasSetter);
    //返回0代表get、set函数均已生成，返回1代表get函数已生成，返回2代表get函数已生成
    if(judge === 0)return '';
    else if(judge === 1) {
        return ` 
\tpublic set${camelCasePropertyName}(value: ${propertyType}) {  
\t\tthis._${prop} = value;  
\t}  `;
    }
    else if(judge === 2) {
        return `
\tpublic get${camelCasePropertyName}(): ${propertyType} {  
\t\treturn this._${prop};  
\t}  `;
    }
    return `
\tpublic get${camelCasePropertyName}(): ${propertyType} {  
\t\treturn this._${prop};  
\t}  
\tpublic set${camelCasePropertyName}(value: ${propertyType}) {  
\t\tthis._${prop} = value;  
\t}  `;
}
// 生成 JS 的get 和 set 的函数，同时判断函数是否已存在
function JSgetset(prop: string, hasGetter:boolean,hasSetter:boolean) {
    const name = prop.startsWith('#') ? prop.substring(1) : prop;
    const camelCasePropertyName = capitalizeFirstLetter(name);
    const judge = judgeExistence(hasGetter, hasSetter);
    //返回0代表get、set函数均已生成，返回1代表get函数已生成，返回2代表get函数已生成
    const propertyName = prop.startsWith('#') ? prop : `_${name}`;


    if(judge === 0)return '';
    else if(judge === 2){
        return `
\tget${camelCasePropertyName}() {  
\t\t return this.${propertyName};  
\t}  `;}
    else if(judge === 1){
        return ` 
\tset${camelCasePropertyName}(value) {  
\t\t this.${propertyName} = value;  
\t}  `;
        } 
    return `
\tget${camelCasePropertyName}() {  
\t\t return this.${propertyName};  
\t}  
\tset${camelCasePropertyName}(value) {  
\t\t this.${propertyName} = value;  
\t}  `;
}
// 生成属性的get或set函数
function getsetfinal(isTS: boolean,isNonStandard: number, prop: string, propertyType: string , hasGetter:boolean,hasSetter:boolean) {
    let getterSetter ='';
    if (isTS) {    
        if (isNonStandard == 1) {
            vscode.window.showErrorMessage(`No access modifier is written for : ${prop} .`);
            return '-1';
        }else if(isNonStandard == 2){
            vscode.window.showErrorMessage(`Property '${prop}' should start with an underscore.`);
            return '-1';
        }
        getterSetter = TSgetset(prop, propertyType, hasGetter, hasSetter);
        
    } else { 
        getterSetter = JSgetset(prop, hasGetter, hasSetter);
    }  
    
    return getterSetter;
}
export {capitalizeFirstLetter, isTypeScript, getsetfinal, getsetfinalES6}