import * as vscode from 'vscode';
import { getLastPropertyPosition  } from './getPositon';
import { ClassAnalyzer } from './getInformation';
import * as func from './involvedfunc';
import { Picker } from './picker';

//单个属性的函数生成
function GSGgenerat(editor: vscode.TextEditor, document: vscode.TextDocument): string {
    const word = new Picker(editor).pickCursorWordText();
    let trimmedName = word.startsWith('#') ? word.substring(1) : word;
    trimmedName = trimmedName.startsWith('_') ? trimmedName.substring(1) : trimmedName;
    const analyzer = new ClassAnalyzer(document);
    let classList = analyzer.getPropertyInformation();
    let getterSetterCode = '';
    classList.some(classInfo => {
        return classInfo.properties.some((prop, index) => {
            if (prop === trimmedName) {
                getterSetterCode = func.getsetfinal(document,classInfo.isNonStandard[index], trimmedName, classInfo.propertyTypes[index], classInfo.name,classInfo.hasGetter[index], classInfo.hasSetter[index]);
                return true; // 终止当前类的属性遍历
            }
            return false; // 继续遍历
        });
    });
    //判断函数是否已经存在
    if(getterSetterCode == ''){
        vscode.window.showErrorMessage(`The function for this attribute already exists : ${trimmedName} .`);
    }
    return getterSetterCode;
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
    const getSetCode = GSGgenerat(editor, document);
    const positionEnd = new vscode.Position(getLastPropertyPosition(document, selection) , 0);

    if(getSetCode !== '-1' && getSetCode !== ''){
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
    const analyzer = new ClassAnalyzer(document);
    const classList = analyzer.getPropertyInformation();
    // console.log(classList);
    
    editor.edit(editBuilder => {
        //一个一个属性生成并插入
        classList.forEach(classInfo => {
            classInfo.properties.forEach((prop, index) => {
            const positionEnd = new vscode.Position(classInfo.position, 0);
            const propertyType = classInfo.propertyTypes[index];
            const getterSetterCode = func.getsetfinal(document,classInfo.isNonStandard[index], prop, propertyType, classInfo.name, classInfo.hasGetter[index],classInfo.hasSetter[index]);
            if(getterSetterCode === ''){
                vscode.window.showErrorMessage(`The function for this attribute already exists : ${prop} `);
            }
            else if(getterSetterCode !== '-1')editBuilder.insert(positionEnd, `\n${getterSetterCode}\n`);
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

//生成选中属性的函数代码并插入
async function SelectGSGenerate() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No editor is active.');
        return;
    }
    const document = editor.document;
    const analyzer = new ClassAnalyzer(document);
    const classList = analyzer.getPropertyInformation();

    const items: vscode.QuickPickItem[] = classList.map(classInfo => {
        return classInfo.properties.map(prop => {
            return {
              label: `Class: ${classInfo.name} - Prop: ${prop}`,
              description: `` 
            };
          });
        }).flat();
 
    const selectedItems = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select Attribute to Generate Corresponding Function',
        canPickMany: true // 设置为 true 以允许用户多选
    });
    if (selectedItems) {
    editor.edit(editBuilder => {
        selectedItems.forEach(item => {
            const [, className, propName] = item.label.match(/^Class: (.*?) - Prop: (.*)$/)!; 
            const selectedClass = classList.find(cls => cls.name === className);
            if (selectedClass) {
                const Index = selectedClass.properties.indexOf(propName);
                const positionEnd = new vscode.Position(selectedClass.position, 0);
                const getterSetterCode = func.getsetfinal(document,selectedClass.isNonStandard[Index], propName.trim(), selectedClass.propertyTypes[Index], className.trim(),selectedClass.hasGetter[Index],selectedClass.hasSetter[Index]);  
                if(getterSetterCode == ''){
                    vscode.window.showErrorMessage(`The function for this attribute already exists : ${propName.trim()} .`);
                }
                else if(getterSetterCode !== '-1')editBuilder.insert(positionEnd, `\n${getterSetterCode}\n`);
                }
            })
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
    let disposableSelect = vscode.commands.registerCommand('extension.SelectGSGenerate', SelectGSGenerate);
    context.subscriptions.push(disposableSelect);
}
// 停用函数
function deactivate() {}

export { activate, deactivate };

