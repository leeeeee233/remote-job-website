# 工作详情抽屉设计文档

## 概述

设计一个工作详情抽屉组件，当用户点击工作卡片时，在右侧显示该工作的详细信息。抽屉设计遵循现代UI设计原则，提供清晰的信息层次和良好的用户体验。

## 架构

### 组件架构
```
┌─────────────────────────────────────────────────────────┐
│                    App Container                         │
├─────────────┬───────────────────────────────────────────┤
│             │                Header                     │
│   Sidebar   ├───────────────────────────────────────────┤
│             │                                           │
│             │            Main Content                   │
│             │     ┌───────────────┬──────────────────┐  │
│             │     │               │                  │  │
│             │     │  Job List     │  Job Details     │  │
│             │     │               │  Drawer          │  │
│             │     │               │                  │  │
└─────────────┴─────┴───────────────┴──────────────────┘  │
                                                          │
                                                          │
└──────────────────────────────────────────────────────────┘
```

### 组件层次结构
- App
  - Sidebar
  - MainContent
    - Header
    - JobFeed
      - JobList (左侧)
        - JobCard (多个)
      - JobDetailsDrawer (右侧)

## 组件和接口

### 1. JobDetailsDrawer 组件
**功能：** 显示工作详情的抽屉组件

**接口：**
```javascript
interface JobDetailsDrawerProps {
  job: JobInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: (jobId: string) => void;
}
```

**设计特点：**
- 宽度：桌面端固定宽度 400px，移动端全屏
- 白色背景，右侧阴影
- 顶部显示关闭按钮
- 底部固定"Apply Now"按钮
- 内容区域可滚动

### 2. JobFeed 组件扩展
**功能：** 管理工作列表和工作详情抽屉的状态

**接口扩展：**
```javascript
// 扩展现有的JobFeed组件
interface JobFeedState {
  // 现有状态
  jobs: JobInfo[];
  filteredJobs: JobInfo[];
  loading: boolean;
  searchTerm: string;
  searching: boolean;
  
  // 新增状态
  selectedJob: JobInfo | null;
  isDrawerOpen: boolean;
}
```

**设计特点：**
- 维护选中的工作和抽屉状态
- 处理工作卡片点击事件
- 在抽屉打开时调整主内容区域布局

### 3. JobCard 组件扩展
**功能：** 处理点击事件以打开工作详情抽屉

**接口扩展：**
```javascript
interface JobCardProps {
  job: JobInfo;
  onSave: (jobId: string) => void;
  onApply: (jobId: string) => void;
  onSelect: (job: JobInfo) => void; // 新增
}
```

**设计特点：**
- 点击卡片时触发onSelect回调
- 保持现有的保存和信息按钮功能

## 数据模型

### JobInfo 扩展
```javascript
interface JobInfo {
  // 现有字段
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  type: string;
  salary: number;
  team: string;
  postedDate: string;
  views: number;
  applicants: number;
  description: string;
  skills: string[];
  
  // 新增字段
  minimumQualifications?: string[];
  preferredQualifications?: string[];
  aboutJob?: string;
  companyInfo?: string;
}
```

## 错误处理

### 数据加载错误
- 如果工作详情数据加载失败，显示错误信息和重试选项
- 如果公司logo加载失败，显示默认占位符

### 用户交互错误
- 防止用户在抽屉打开过程中多次点击
- 处理抽屉关闭时的状态重置

## 测试策略

### 单元测试
- 测试JobDetailsDrawer组件的渲染
- 测试打开和关闭抽屉的功能
- 测试"Apply Now"按钮的点击事件

### 集成测试
- 测试JobCard点击与JobDetailsDrawer打开的集成
- 测试工作详情数据的正确显示
- 测试响应式布局在不同设备上的表现

## 设计细节

### 抽屉动画
```css
.job-details-drawer {
  transform: translateX(100%);
  transition: transform 0.3s ease-in-out;
}

.job-details-drawer.open {
  transform: translateX(0);
}
```

### 信息布局
- 顶部：公司logo、职位名称、公司名称、地点
- 中部：薪资信息、团队信息、资格要求
- 底部：工作描述、"Apply Now"按钮

### 响应式设计
- 桌面端：右侧抽屉，主内容区域调整宽度
- 平板端：右侧抽屉，覆盖部分主内容
- 移动端：全屏抽屉，带返回按钮

### 颜色方案
- 使用与主应用一致的颜色方案
- 强调色用于"Apply Now"按钮
- 中性色用于背景和文本

### 交互反馈
- 点击卡片时提供视觉反馈
- 抽屉打开和关闭时使用平滑过渡动画
- "Apply Now"按钮悬停效果