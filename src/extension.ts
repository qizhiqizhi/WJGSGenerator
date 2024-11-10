import * as vscode from 'vscode';
import {getLastPropertyPosition, getPropertyPosition } from './getPositon';
import * as func from './involvedfunc';
import { Picker } from './picker';
//单个属性的函数生成
function GSGgenerat(editor: vscode.TextEditor, document: vscode.TextDocument, selection: vscode.Selection): string {
    const pickerMember = new Picker(editor);
    const word = pickerMember.pickCursorWordText();
    const trimmedName = word.startsWith('#') ? word.substring(1) : word;
    const classList = getPropertyPosition(document);
    let protype ="";
    let acessmodify = false;
    classList.forEach(classInfo => {
        classInfo.properties.forEach((prop, index) => {
            if(prop === word){
                protype = classInfo.protypes[index];
                acessmodify = classInfo.isWithoutModifiers[index];
            }
        })
    });
    const camelCasePropertyName = func.capitalizeFirstLetter(trimmedName);
    const isTS = func.isTypeScript(document);
    let getterSetter: string; 
    if (isTS) {    
        if (acessmodify) {
            vscode.window.showErrorMessage(`No access modifier is written for : ${trimmedName} .`);
            return '';
        }
        getterSetter = `  
            get ${camelCasePropertyName}(): ${protype} {  
                return this.${trimmedName};  
            }  
            set ${camelCasePropertyName}(value: ${protype}) {  
                this.${trimmedName} = value;  
            }  
        `;  
    } else { 
        getterSetter = `  
            get ${camelCasePropertyName}() {  
                return this.${trimmedName};  
            }  
            set ${camelCasePropertyName}(value) {  
                this.${trimmedName} = value;  
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
                if(classInfo.isWithoutModifiers[index] === true){
                    vscode.window.showErrorMessage(`No access modifier is written for : ${prop} in ${classInfo.name} class.`);
                    return '';
                }
                const getterSetter = `  
\tget ${camelCasePropertyName}(): ${propertyType} {  
\t\treturn this.${prop};  
\t}  
\tset ${camelCasePropertyName}(value: ${propertyType}) {  
\t\tthis.${prop} = value;  
\t}  `;  
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
\tget ${camelCasePropertyName}() {  
\t\treturn this.${prop};  
\t}  
\tset ${camelCasePropertyName}(value) {  
\t\tthis.${prop} = value;  
\t}  `;  
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