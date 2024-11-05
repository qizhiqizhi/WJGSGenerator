import * as vscode from 'vscode';
import {getLastPropertyPosition} from './getPositon';
import * as func from './involvedfunc';

function GSGgenerat(editor: vscode.TextEditor, document: vscode.TextDocument, selection: vscode.Selection): string {
    const selectedText = document.getText(selection);
    const propertyName = selectedText.trim();
    const camelCasePropertyName = func.capitalizeFirstLetter(propertyName);  
    //拿到属性所在行代码，获得属性的类型（此处受换行影响！）
    const lineText = document.lineAt(selection.end.line).text;
      
    const propertyType = func.getTypeFromComment(lineText);   
    const accessModifier = func.getAccessModifier(lineText); 
    let getterSetter: string;  
    if (!accessModifier) {
        vscode.window.showErrorMessage('No access modifier is written for the variable.');
        return '';
    }
    const isTS = func.isTypeScript(document);
    if (isTS) {  
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
}
// 停用函数
function deactivate() {}

export { activate, deactivate };