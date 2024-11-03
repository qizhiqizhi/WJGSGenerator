import {ASTUtil} from './ASTUtil';
import * as vscode from 'vscode';
function getClassposition(document:vscode.TextDocument, selection: vscode.Selection): number {
    const selectedText = document.getText(selection);
    //除前后空白
    const propertyName = selectedText.trim();
    const matchedProperty = ASTUtil.memberInfos.properties.find(propertyInfo => propertyInfo.name === propertyName);
    if (matchedProperty) {
        // 查找包含该属性的类的结束行号
        const classEndRow = ASTUtil.memberInfos.classes.reduce((prevEndRow, classInfo) => {
          if (matchedProperty.startRow >= classInfo.startRow && matchedProperty.startRow <= classInfo.endRow) {
            return classInfo.endRow;
          }
          // 返回之前找到的最大行号
          return prevEndRow;
        }, -1);  
        if (classEndRow !== -1) {
          return classEndRow;
        }
        else return -1;
      }
      else return -1;
}
export function getLastPropertyPosition(document:vscode.TextDocument, selection: vscode.Selection): number {
    const classEndRow = getClassposition(document, selection);
    let flag = 0;
    const propertiesEndRow = ASTUtil.memberInfos.properties.reduce((prevEndRow, PropertyInfo) => {
        if (PropertyInfo.startRow >= classEndRow && flag == 0) {
            flag = 1;
            return prevEndRow;
        }
        return PropertyInfo.startRow;
    }, -1);  
    return propertiesEndRow;

}
