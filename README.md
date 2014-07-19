# an.js

## an against Tan

### 目录结构

	/dist           # 构建目标目录
	/build          # 构建代码模块
	/partials       # 代码模块
	/images         # 必要的一些图片
	/test           # 测试代码

### 根目录下文件说明

	LICENSE         # LICENSE

	README.md       #
	CHANGELOG.md    #

	.bowerrc        # bower 配置

	.gitattributes  # git 相关
	.gitignore      # git 相关

	package.json    #
	bower.json      #

### 新模块普生线路

/partials/EXPT --> /partials/SUB --> /partials/*

__/partials/EXPT__
封装一个新特性的模块, 即可不拘谨地加入 /partials/EXPT

__/partials/SUB__
某些情况会使用上的模块, 但无法在现有的模块分类下匹配, 也无足够理由新建一个分类.
这种情况则放入 SUB 模块类下.

__/partials/*__
稳定的模块类.

### git 分支管理

0: 提交间隔最长
1: 提交间隔较长
2: 频繁地提交

+ [0]release
+ [1]master
+ [2]feature
+ [2]dev
