import * as vscode from 'vscode';
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
// 生成 TS 的get 和 set 的函数
function TSgetset(prop: string, propertyType: string ) {
    const camelCasePropertyName = capitalizeFirstLetter(prop);
    return `
\tpublic get${camelCasePropertyName}(): ${propertyType} {  
\t\treturn this.${prop};  
\t}  
\tpublic set${camelCasePropertyName}(value: ${propertyType}) {  
\t\tthis.${prop} = value;  
\t}  `;
}
// 生成 JS 的get 和 set 的函数
function JSgetset(prop: string) {
    const camelCasePropertyName = capitalizeFirstLetter(prop);
    return `
\tget${camelCasePropertyName}() {  
\t\treturn this.${prop};  
\t}  
\tset${camelCasePropertyName}(value) {  
\t\tthis.${prop} = value;  
\t}  `;
}
export {capitalizeFirstLetter, isTypeScript, getIndentationLevel,JSgetset, TSgetset}