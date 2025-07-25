# UI重设计设计文档

## 概述

基于现代化求职网站的设计趋势，重新设计远程工作网站的用户界面。设计采用左侧导航 + 主内容区域的经典布局，注重用户体验和视觉层次。

## 架构

### 布局架构
```
┌─────────────────────────────────────────────────────────┐
│                    App Container                         │
├─────────────┬───────────────────────────────────────────┤
│             │                Header                     │
│   Sidebar   ├───────────────────────────────────────────┤
│             │                                           │
│             │            Main Content                   │
│             │                                           │
└─────────────┴───────────────────────────────────────────┘
```

### 组件层次结构
- App
  - Sidebar
    - Navigation
    - UserProfile
  - MainContent
    - Header (搜索和筛选)
    - JobFeed
      - JobCard (多个)

## 组件和接口

### 1. Sidebar 组件
**功能：** 左侧导航栏，包含主要功能入口和用户信息

**接口：**
```javascript
interface SidebarProps {
  currentPage: string;
  user: UserInfo;
  onNavigate: (page: string) => void;
}
```

**设计特点：**
- 固定宽度 240px
- 深色背景 (#1a1a1a)
- 导航项使用图标 + 文字
- 底部显示用户头像和信息

### 2. Header 组件
**功能：** 顶部搜索和筛选区域

**接口：**
```javascript
interface HeaderProps {
  onSearch: (query: string) => void;
  onFilter: (filters: FilterOptions) => void;
  activeFilters: string[];
}
```

**设计特点：**
- 白色背景
- 搜索框居左，筛选标签居中，排序选项居右
- 使用蓝色主题色 (#6366f1)

### 3. JobCard 组件重设计
**功能：** 显示工作信息的卡片

**接口：**
```javascript
interface JobCardProps {
  job: JobInfo;
  onSave: (jobId: string) => void;
  onApply: (jobId: string) => void;
}
```

**设计特点：**
- 白色背景，圆角 8px
- 左侧公司logo (48x48px)
- 右侧操作按钮（保存、分享）
- 薪资信息突出显示

## 数据模型

### JobInfo 扩展
```javascript
interface JobInfo {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract';
  salary: {
    amount: number;
    currency: string;
    period: 'year' | 'month';
  };
  team: string;
  postedDate: string;
  views: number;
  applicants: number;
  description: string;
  skills: string[];
}
```

### UserInfo
```javascript
interface UserInfo {
  id: string;
  name: string;
  avatar: string;
  role: string;
  isOnline: boolean;
}
```

## 错误处理

### 搜索错误
- 网络错误时显示重试选项
- 无结果时显示友好的空状态页面
- 搜索超时时提供反馈

### 图片加载错误
- 公司logo加载失败时显示默认占位符
- 用户头像加载失败时显示默认头像

## 测试策略

### 单元测试
- 各组件的渲染测试
- 搜索和筛选逻辑测试
- 用户交互事件测试

### 集成测试
- 搜索流程端到端测试
- 筛选功能集成测试
- 响应式布局测试

### 视觉测试
- 不同屏幕尺寸下的布局测试
- 主题色彩一致性测试
- 交互状态视觉反馈测试

## 设计系统

### 颜色方案
```css
:root {
  --primary-color: #6366f1;
  --primary-hover: #5855eb;
  --secondary-color: #64748b;
  --background-color: #f8fafc;
  --card-background: #ffffff;
  --sidebar-background: #1e293b;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;
}
```

### 字体系统
```css
--font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-size-xs: 12px;
--font-size-sm: 14px;
--font-size-base: 16px;
--font-size-lg: 18px;
--font-size-xl: 20px;
--font-size-2xl: 24px;
```

### 间距系统
```css
--spacing-1: 4px;
--spacing-2: 8px;
--spacing-3: 12px;
--spacing-4: 16px;
--spacing-5: 20px;
--spacing-6: 24px;
--spacing-8: 32px;
```

## 响应式设计

### 断点
- Mobile: < 768px
- Tablet: 768px - 1024px  
- Desktop: > 1024px

### 移动端适配
- 侧边栏在移动端收起为汉堡菜单
- 搜索和筛选区域垂直堆叠
- 工作卡片单列显示
- 触摸友好的按钮尺寸