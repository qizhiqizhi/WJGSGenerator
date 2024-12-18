
import { TsFileParser } from './tsFileParser';
import { ts, PropertyDeclaration, SyntaxKind } from "ts-morph";
import * as vscode from 'vscode';
import * as fs from 'fs';

interface ClassInfo {
	name: string;
	position: number;
	properties: string[];
	propertyTypes: string[];
	isNonStandard: number[];
	hasSetter: boolean[];
	hasGetter: boolean[];
}
export class ClassAnalyzer {
    private document: vscode.TextDocument;

    constructor() {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			this.document = editor.document;
		} else {
			vscode.window.showErrorMessage('No editor is active.');
			throw new Error('No active document');
		}
	}


  // 获取类中属性的访问修饰符
  private getModifiers(propDecl: PropertyDeclaration): string[] {
    const modifiers = propDecl.getModifiers().map(modifier => {
      switch (modifier.getKind()) {
        case ts.SyntaxKind.PrivateKeyword:
          return "private";
        case ts.SyntaxKind.ProtectedKeyword:
          return "protected";
        default:
          return ""; // 如果不需要未知修饰符，可以返回空字符串或忽略
      }
    }).filter(mod => mod !== ""); // 移除空字符串
    return modifiers;
  }

  // 获取文件中所有属性的基础信息
  public getPropertyInformation(): ClassInfo[] {

    const fileName = this.document.fileName;
    const sourceFile = TsFileParser.parse(fileName);
    const classList: ClassInfo[] = [];

    sourceFile.getClasses().forEach(classDecl => {
      const className = classDecl.getName();
      if (className) {
        const classInfo: ClassInfo = {
			name: className,
			position: 0,
			properties: [],
			propertyTypes: [],
			isNonStandard: [],
			hasSetter: [],
			hasGetter: []
        };
		// 创建属性名到索引的映射表
		const propertyNameToIndexMap = new Map<string, number>();
		const propertyCount = classDecl.getProperties().length;
		classInfo.hasSetter = new Array(propertyCount).fill(false);
		classInfo.hasGetter = new Array(propertyCount).fill(false);

        classDecl.getProperties().forEach((propDecl, index) => {
        	const propName = propDecl.getName();
			const propType = propDecl.getType().getText();
			const modifiers = this.getModifiers(propDecl);
			
			!propName.startsWith('_') ? classInfo.isNonStandard.push(2) : 0;
			classInfo.isNonStandard.push(modifiers.length <= 0 ? 1 : 0);

			let trimmedName = propName.startsWith('_') ? propName.substring(1) : propName;
			classInfo.properties.push(trimmedName);
			trimmedName = trimmedName.startsWith('#') ? trimmedName.substring(1) : trimmedName;
			classInfo.propertyTypes.push(propType);

			propertyNameToIndexMap.set(trimmedName, index);
			if (index === propertyCount - 1) {
				classInfo.position = propDecl.getEndLineNumber();
			}

        });
		
        classDecl.getInstanceMembers().forEach(member => {
			const propertyIndex = propertyNameToIndexMap.get(member.getName());
			if(propertyIndex !== -1 && propertyIndex!== undefined){
				if (member.getKind() === SyntaxKind.GetAccessor) {
					classInfo.hasGetter[propertyIndex] = true;
				} else if (member.getKind() === SyntaxKind.SetAccessor) {
					classInfo.hasSetter[propertyIndex] = true;
				}
			}
        });
		classDecl.getMethods().forEach(methodDecl => {
			const methodName = methodDecl.getName();
			// 检查方法名是否符合 set+prop 或 get+prop 的模式
			if (methodName.startsWith('set') || methodName.startsWith('get')) {
				const propPart = methodName.slice(3); // 去掉前缀 "set" 或 "get"
				const lowerCasePropPart = propPart.charAt(0).toLowerCase() + propPart.slice(1);	
				const propertyIndex = propertyNameToIndexMap.get(lowerCasePropPart);	
				if (propertyIndex !== -1 && propertyIndex!== undefined) {
					
					if (methodName.startsWith('set')) {
						classInfo.hasSetter[propertyIndex]= true;
					} else {
						classInfo.hasGetter[propertyIndex] = true;
					} 
				}
			}
		});
        classList.push(classInfo);
      }
    });
	// console.log(classList);
	
    return classList;
  }

}
