import * as vscode from 'vscode';
import {getLastPropertyPosition, getPropertyPosition, judgeExi } from './getPositon';
import * as func from './involvedfunc';
import { Picker } from './picker';
//单个属性的函数生成
function GSGgenerat(editor: vscode.TextEditor, document: vscode.TextDocument, selection: vscode.Selection): string {
    const word = new Picker(editor).pickCursorWordText();
    const trimmedName = word.startsWith('#') ? word.substring(1) : word;
    let classList = getPropertyPosition(document);
    let protype ="";
    let classname ="";
    let acessmodify = false;
    classList.forEach(classInfo => {
        classInfo.properties.forEach((prop, index) => {
            if(prop === word){
                protype = classInfo.protypes[index];
                classname = classInfo.name;
                acessmodify = classInfo.isWithoutModifiers[index];
            }
        })
    });
    const isTS = func.isTypeScript(document);
    let getterSetter =''; 
    //获得对应的函数代码
    if (isTS) {    
        if (acessmodify) {
            vscode.window.showErrorMessage(`No access modifier is written for : ${trimmedName} .`);
            return getterSetter;
        }
        getterSetter = func.TSgetset(document, trimmedName, protype, classname);
    } else { 
        getterSetter = func.JSgetset(document, trimmedName, classname);
    }  
    //判断函数是否已经存在
    if(getterSetter == ''){
        vscode.window.showErrorMessage(`The function for this attribute already exists : ${trimmedName} .`);
        return getterSetter;
    }
    return getterSetter;
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

    if(getSetCode !== indentation){
        editor.edit(editBuilder => {
            editBuilder.insert(positionEnd, `\n${getSetCode}\n`);
        }).then(success => {
            if (!success) {
                vscode.window.showErrorMessage('Failed to insert getter and setter methods.');
            }
            else{
                document.save();
            };
        });
    }
     
}

//文件内所有属性的函数生成与插入
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
            //一个一个属性生成并插入
            classList.forEach(classInfo => {
                classInfo.properties.forEach((prop, index) => {
                const positionEnd = new vscode.Position(classInfo.Position, 0);
                const propertyType = classInfo.protypes[index];
                if(classInfo.isWithoutModifiers[index] === true){
                    vscode.window.showErrorMessage(`No access modifier is written for : ${prop} in ${classInfo.name} class.`);
                    return '';
                }
                const getterSetterCode = func.TSgetset(document,prop, propertyType, classInfo.name);
                if(getterSetterCode === ''){
                    vscode.window.showErrorMessage(`The function for this attribute already exists : ${prop} .${classInfo.name}`);
                }
                else editBuilder.insert(positionEnd, `\n${getterSetterCode}\n`);
                })
            });
        }).then(success => {
            if (!success) {
                vscode.window.showErrorMessage('Failed to insert getter and setter methods.');
            }
            else{
                document.save();
            };
        });
    }
    else{
        editor.edit(editBuilder => {
            classList.forEach(classInfo => {
                classInfo.properties.forEach(prop => {
                const positionEnd = new vscode.Position(classInfo.Position, 0);
                const getterSetterCode = func.JSgetset(document,prop, classInfo.name);
                if(getterSetterCode == ''){
                    vscode.window.showErrorMessage(`The function for this attribute already exists : ${prop} .`);
                }
                else editBuilder.insert(positionEnd, `\n${getterSetterCode}\n`);
                })
            });
        }).then(success => {
            if (!success) {
                vscode.window.showErrorMessage('Failed to insert getter and setter methods.');
            }
            else{
                document.save();
            };
        });
    }
    
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