# Generate TS and JS Getters / Setters

**现有功能:**

1.针对TS、JS生成传统面向对象方法的set、get函数或ES6存取器的set、get函数

2.能够识别函数是否重复，避免重复生成函数

3.能够对修饰符缺失以及'_'缺失的情况进行提示

4.能够针对单个属性、单个文件（文件内所有类）以及在快速选择框中选择属性生成函数

**使用:**

(JS使用与TS使用相同，故只展示TS的使用)

针对传统面向对象写法：

1.单个属性插入函数：选中某个属性使用generateGetterSetter或使用快捷键ctrl+win+shift+x

![img](./pic/single.gif)

2.文件插入函数：使用generateGetterSetterForAll或使用快捷键ctrl+win+shift+z

![img](./pic/all.gif)

3.选中属性生成函数：使用SelectGSGenerate或使用快捷键ctrl+alt+h

![img](./pic/select.gif)

针对ES6存取器写法：

4.单个属性插入函数：选中某个属性使用generateGetterSetterES6或使用快捷键ctrl+win+shift+s

![img](./pic/singleES6.gif)

5.文件插入函数：使用generateGetterSetterForAllES6或使用快捷键ctrl+win+shift+d

![img](./pic/allES6.gif)

6.选中属性生成函数：使用SelectGSGenerateES6或使用快捷键ctrl+alt+g

![img](./pic/selectES6.gif)