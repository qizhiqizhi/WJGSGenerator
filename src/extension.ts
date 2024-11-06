import * as vscode from 'vscode';
import {getLastPropertyPosition, getPropertyPosition } from './getPositon';
import * as func from './involvedfunc';
//单个属性的函数生成
function GSGgenerat(editor: vscode.TextEditor, document: vscode.TextDocument, selection: vscode.Selection): string {
    const selectedText = document.getText(selection);
    const propertyName = selectedText.trim();
    const camelCasePropertyName = func.capitalizeFirstLetter(propertyName);  
    //拿到属性所在行代码，获得属性的类型（此处受换行影响！）
    const lineText = document.lineAt(selection.end.line).text;
    const isTS = func.isTypeScript(document);
    let getterSetter: string;
    const propertyType = func.getTypeFromComment(lineText);   
    if (isTS) {  
        const accessModifier = func.getAccessModifier(lineText);   
        if (!accessModifier) {
            vscode.window.showErrorMessage('No access modifier is written for the variable.');
            return '';
        }
        getterSetter = `  
            get ${camelCasePropertyName}(): ${propertyType} {  
                return this.${propertyName};  
            }  
            set ${camelCasePropertyName}(value: ${propertyType}) {  
                this.${propertyName} = value;  
            }  
        `;  
    } else { 
        getterSetter = `  
            get ${camelCasePropertyName}() {  
                return this.${propertyName};  
            }  
            set ${camelCasePropertyName}(value) {  
                this.${propertyName} = value;  
            }  
        `;  
    }  
    return getterSetter;
}
//文件内所有属性的函数生成以及插入
function generateGSForAllProperties() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No editor is active.');
        return;
    }
    const document = editor.document;
    const isTS = func.isTypeScript(document);
    const classList = getPropertyPosition(document);
    
    if(isTS){
        editor.edit(editBuilder => {
            classList.forEach(classInfo => {
                classInfo.properties.forEach((prop, index) => {
                const camelCasePropertyName = func.capitalizeFirstLetter(prop);
                const positionEnd = new vscode.Position(classInfo.Position, 0);
                const propertyType = classInfo.protypes[index];
                const getterSetter = `  
\t\tget ${camelCasePropertyName}(): ${propertyType} {  
\t\t\treturn this.${prop};  
\t\t}  
\t\tset ${camelCasePropertyName}(value: ${propertyType}) {  
\t\t\tthis.${prop} = value;  
\t\t}  `;  
                editBuilder.insert(positionEnd, `\n${getterSetter}\n`);
                })
            });
        }).then(success => {
            if (!success) {
            vscode.window.showErrorMessage('Failed to insert getter and setter methods.');
            }
        });
    }
    else{
        editor.edit(editBuilder => {
            classList.forEach(classInfo => {
                classInfo.properties.forEach(prop => {
                const camelCasePropertyName = func.capitalizeFirstLetter(prop);
                const positionEnd = new vscode.Position(classInfo.Position, 0);
                const getterSetter = `  
\t\tget ${camelCasePropertyName}() {  
\t\t\treturn this.${prop};  
\t\t}  
\t\tset ${camelCasePropertyName}(value) {  
\t\t\tthis.${prop} = value;  
\t\t}  `;  
                editBuilder.insert(positionEnd, `\n${getterSetter}\n`);
                })
            });
        }).then(success => {
            if (!success) {
            vscode.window.showErrorMessage('Failed to insert getter and setter methods.');
            }
        });
    }
    
}
//单个属性的函数插入
function GSGenerateCommand() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No editor is active.');
        return;
    }
    const document = editor.document;
    const selection = editor.selection;
    if (selection.isEmpty) {
        vscode.window.showErrorMessage('No selection. Please select a property name.');
        return;
    }
    const currentLineText = document.lineAt(selection.end.line).text;  
    // 获取当前行的缩进级别  
    const indentation = func.getIndentationLevel(currentLineText);
    const getSetCode = GSGgenerat(editor, document, selection).replace(/^\s*/gm, indentation);
    const lastPropertyPosition = getLastPropertyPosition(document, selection);
    const positionEnd = new vscode.Position(lastPropertyPosition , 0);
    editor.edit(editBuilder => {
        editBuilder.insert(positionEnd, `\n${getSetCode}\n`);
    }).then(success => {
        if (!success) {
            vscode.window.showErrorMessage('Failed to insert getter and setter methods.');
        }
    });
     
}
// 激活函数
function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.generateGetterSetter', GSGenerateCommand);
    context.subscriptions.push(disposable);
    let disposableAll = vscode.commands.registerCommand('extension.generateGetterSetterForAll', generateGSForAllProperties);
    context.subscriptions.push(disposableAll);
}
// 停用函数
function deactivate() {}

export { activate, deactivate };