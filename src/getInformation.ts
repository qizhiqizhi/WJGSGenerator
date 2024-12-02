import { Picker } from './picker';
import { TsFileParser } from './tsFileParser';
import { ts, PropertyDeclaration, AccessorDeclaration, SyntaxKind } from "ts-morph";
import * as vscode from 'vscode';

interface ClassInfo {
  name: string;
  position: number;
  properties: string[];
  propertyTypes: string[];
  isWithoutModifiers: boolean[];
  hasSetter: boolean[];
  hasGetter: boolean[];
}
export class ClassAnalyzer {
  private document: vscode.TextDocument;

  constructor(document: vscode.TextDocument) {
    this.document = document;
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
			isWithoutModifiers: [],
			hasSetter: [],
			hasGetter: []
        };

        classDecl.getProperties().forEach((propDecl, index) => {
        	const propName = propDecl.getName();
			const propType = propDecl.getType().getText();
			const modifiers = this.getModifiers(propDecl);
			classInfo.isWithoutModifiers.push(modifiers.length <= 0 ? true : false);

			let trimmedName = propName.startsWith('#') ? propName.substring(1) : propName;
			trimmedName = propName.startsWith('_') ? propName.substring(1) : propName;
			classInfo.properties.push(trimmedName);
			classInfo.propertyTypes.push(propType);

			if (index === classDecl.getProperties().length - 1) {
				classInfo.position = propDecl.getEndLineNumber();
			}
        });
        classDecl.getInstanceMembers().forEach(member => {
            const propertyIndex = classInfo.properties.findIndex(prop => prop === member.getName());
			if(propertyIndex!== -1){
				if (member.getKind() === SyntaxKind.GetAccessor) {
					classInfo.hasGetter[propertyIndex] = true;
				} else if (member.getKind() === SyntaxKind.SetAccessor) {
					classInfo.hasSetter[propertyIndex] = true;
				}else{
					classInfo.hasGetter[propertyIndex] = false;
					classInfo.hasSetter[propertyIndex] = false;
				}
			}
        });
        classList.push(classInfo);
      }
    });
    return classList;
  }

  // 判断该函数是否已存在
    public judgeExistence(className: string, methodName: string, hasGetter:boolean, hasSetter:boolean): number {
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
}
