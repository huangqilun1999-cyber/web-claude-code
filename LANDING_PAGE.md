# 落地页设计文档

## 概述

为Web Claude Code项目创建的现代化、科技感落地页,采用深色系配色方案,包含丰富的交互动画和流畅的转场效果。

## 设计理念

### 配色方案
- **主色调**: 深色系 (黑色 #000000, 深灰 #0a0a0a, #1a1a1a)
- **强调色**: 青色渐变 (#22D3EE - Cyan 400)、蓝色 (#3B82F6 - Blue 500)、紫色 (#A855F7 - Purple 500)
- **去AI感**: 避免五颜六色,采用专业的科技配色
- **科技感**: 使用渐变、光晕、粒子效果营造未来科技氛围

### 动画设计
1. **粒子动画背景** - Hero区域的动态粒子连线效果
2. **滚动触发动画** - 元素进入视口时的淡入和平移效果
3. **悬浮交互** - 卡片悬浮时的缩放、阴影、光晕效果
4. **打字机效果** - 代码演示区的实时输入模拟
5. **平滑滚动** - 锚点跳转的丝滑过渡

## 页面结构

### 1. Navigation (导航栏)
- **特性**:
  - 滚动时背景模糊效果
  - Logo悬浮旋转动画
  - 响应式移动端菜单
  - 下划线跟随效果

### 2. Hero Section (首屏)
- **特性**:
  - Canvas粒子动画背景(80个粒子,距离<150px时连线)
  - 渐变文字效果
  - 分阶段淡入动画
  - 双CTA按钮(主要+次要)
  - 特性标签展示

### 3. Features Section (功能展示)
- **8个核心功能卡片**:
  - 远程对话
  - 文件管理
  - Web终端
  - Git集成
  - 项目模板
  - 实时同步
  - 安全加密
  - 移动适配

- **交互效果**:
  - Intersection Observer触发淡入
  - 悬浮时卡片上浮
  - 图标旋转效果
  - 底部光带渐变
  - 外部光晕

### 4. Code Demo Section (代码演示)
- **3个交互式演示**:
  - 文件操作
  - 终端命令
  - Git操作

- **交互效果**:
  - 标签页切换
  - 打字机代码输入效果(30ms/字符)
  - 双栏布局(代码 | 输出)
  - 代码复制功能
  - 运行按钮动画

### 5. Tech Stack Section (技术栈)
- **12项技术展示**:
  - 前端: Next.js, React, TypeScript, Tailwind
  - 状态: Zustand
  - 数据: PostgreSQL, Prisma
  - 通信: WebSocket
  - 其他: NextAuth, Monaco, Node.js, Docker

- **交互效果**:
  - 卡片悬浮缩放+旋转
  - 渐变光效
  - 分批次淡入(50ms延迟)

### 6. CTA Section (行动号召)
- **特性**:
  - 超大渐变光晕背景
  - 双层卡片效果
  - 根据登录状态显示不同CTA
  - 附加信息标签

### 7. Footer (页脚)
- 简洁的版权和链接信息

## 技术实现

### 核心技术栈
```
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Lucide Icons
```

### 动画技术
```
- CSS Animations (@keyframes)
- Intersection Observer API
- Canvas API (粒子效果)
- CSS Transitions
- Transform & Scale
```

### 响应式设计
```
- Mobile First
- 断点: sm (640px), md (768px), lg (1024px), xl (1280px)
- 移动端导航菜单
- 灵活的网格布局
```

## 性能优化

1. **懒加载**: Intersection Observer按需触发动画
2. **CSS优化**: 使用transform和opacity实现动画(GPU加速)
3. **Canvas优化**: 粒子数量控制在80个
4. **代码分割**: Next.js自动代码分割
5. **图片优化**: 使用next/image (如需要)

## 文件结构

```
apps/web/src/
├── app/
│   ├── page.tsx                    # 主页面(服务端组件)
│   └── globals.css                 # 全局样式+动画
└── components/
    └── landing/
        ├── LandingPage.tsx         # 主容器(客户端)
        ├── Navigation.tsx          # 导航栏
        ├── HeroSection.tsx         # 首屏+粒子背景
        ├── FeaturesSection.tsx     # 功能展示
        ├── CodeDemoSection.tsx     # 代码演示
        ├── TechStackSection.tsx    # 技术栈
        └── CTASection.tsx          # CTA区域
```

## 使用说明

### 开发环境
```bash
cd apps/web
pnpm dev
```

访问 http://localhost:3000 查看落地页

### 生产构建
```bash
pnpm build
pnpm start
```

## 自定义指南

### 修改配色
在各组件的`gradient`和`color`属性中修改:
```tsx
// 示例: FeaturesSection.tsx
gradient: 'from-cyan-500 to-blue-600'  // 修改渐变色
```

### 调整动画速度
在`globals.css`中修改:
```css
.animate-fade-in-up {
  animation: fadeInUp 0.8s ease-out forwards; /* 修改持续时间 */
}
```

### 添加新功能卡片
在`FeaturesSection.tsx`的`features`数组中添加:
```tsx
{
  icon: YourIcon,
  title: '新功能',
  description: '功能描述',
  color: 'cyan',
  gradient: 'from-cyan-500 to-blue-600',
}
```

## 浏览器兼容性

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS 14+, Android 5+)

## 特别说明

### Canvas粒子效果
- 自适应窗口大小
- 自动边界检测
- 流畅的60fps动画
- 响应式清理

### 滚动性能
- 使用`scroll-behavior: smooth`实现平滑滚动
- Intersection Observer优化动画触发
- CSS `will-change`提示浏览器优化

## 后续优化建议

1. 添加深色/浅色主题切换
2. 增加更多微交互动画
3. 添加加载骨架屏
4. 优化移动端体验
5. 添加视频演示
6. SEO优化(meta标签、结构化数据)
7. 添加Google Analytics
8. 添加用户反馈组件

## 作者

Claude Sonnet 4.5
