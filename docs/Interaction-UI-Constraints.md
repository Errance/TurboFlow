# 交互与 UI 一致性约束

> 本文档不是视觉设计规范，而是确保原型在不同页面/组件之间保持视觉一致性的**最低约束集**。
> 视觉风格对齐 TurboFlow 现有交易界面（深色主题 + teal/pink 配色）。

---

## 视觉参照

截图参考：`assets/image-0ce7cb1b-e30c-4eec-913f-67b9ab19674e.png`（TurboFlow 交易页面）

---

## Typography（字体一致性）

字体族：**Inter**（通过 Google Fonts 引入：400 / 500 / 600 / 700）。若 TurboFlow 现有项目已配置其他字体，则以现有为准；否则用 Inter。

| 用途 | 桌面端 | 移动端 | 字重 |
|------|--------|--------|------|
| 页面标题 | 24px | 20px | font-bold (700) |
| 区域标题 | 18px | 16px | font-semibold (600) |
| 正文 | 14px | 14px | font-normal (400) |
| 辅助文字/标签 | 12px | 12px | font-normal, text-gray-400 |
| 数字/价格 | 14px | 14px | font-mono, tabular-nums, font-medium (500) |

---

## 主题：深色模式（Dark Theme）

对齐 TurboFlow 现有 UI，全局采用深色主题，文字为浅色。

### 背景层级

| 层级 | 色值 | Tailwind 近似 | 用途 |
|------|------|---------------|------|
| 页面底色 | `#0B0B0F` | — (自定义) | 最底层背景 |
| 面板/卡片 | `#161622` | — (自定义) | 侧边栏、卡片、弹窗底色 |
| 输入框/控件 | `#1C1C28` | — (自定义) | Input、Select、下拉菜单 |
| Hover 态 | `#252536` | — (自定义) | 列表行 hover、按钮 hover |

### Semantic Colors（语义色）

> 色值用于原型一致性与方向语义（YES/NO），不追求品牌规范精修。

| 语义 | 色值 | 用途 |
|------|------|------|
| **Primary / Long / YES** | `#2DD4BF` (teal-400) | 主要按钮、活跃 Tab、Long/YES 方向、正值 |
| **Danger / Short / NO** | `#E85A7E` | Short/NO 方向、负值、错误、拒绝 |
| **Warning** | `#F59E0B` (amber-500) | 警告提示 |
| **Text Primary** | `#FFFFFF` | 主文字 |
| **Text Secondary** | `#8A8A9A` | 辅助文字、标签、说明 |
| **Border** | `#252536` | 面板分隔线、输入框边框 |

---

## Button（按钮一致性）

- **变体**：
  - **Primary (Long/YES)**：bg `#2DD4BF`，文字 `#0B0B0F`（深色字在亮背景上）
  - **Danger (Short/NO)**：bg `#E85A7E`，文字 white
  - **Secondary**：bg `#1C1C28`，文字 white，border `#252536`
  - **Ghost**：bg transparent，文字 `#8A8A9A`，hover bg `#252536`
- **状态**：Default / Hover / Active / Disabled / Loading
- **尺寸**：sm (36px) / md (40px) / lg (48px)
- **圆角**：8px (rounded-lg)
- Disabled: opacity-40 + cursor-not-allowed
- Loading: spinner 替换文字 + 禁用点击

---

## Radius（圆角统一）

| 元素 | 圆角 |
|------|------|
| 卡片 / 弹窗 / 抽屉 | 12px (rounded-xl) |
| 按钮 / 输入框 / 选择器 | 8px (rounded-lg) |
| Badge / Tag / Pill（如 USDT 选择器）| rounded-full |

---

## Spacing（基础间距）

基础单位 4px（Tailwind 默认 scale）。

| 场景 | 值 |
|------|------|
| 页面级边距 | 桌面 px-6 (24px) / 移动 px-4 (16px) |
| 卡片内边距 | p-4 (16px) |
| 区域之间 | mt-6 (24px) |
| 表单字段之间 | gap-4 (16px) |
| 行内元素间距 | gap-2 (8px) |

---

## Touch Targets（触控安全）

- 所有可点击元素最小 **44x44px** 触控区（Apple HIG）
- 盘口价位行：min-h-[44px]，**整行可点**（不仅数字可点）
- 图标按钮：视觉可小，但点击区必须 >= 44x44px
- 列表项最小高度：48px

---

## Feedback（状态反馈）

| 状态 | 视觉表现 |
|------|----------|
| Pending | spinner + opacity 降低 |
| Success | teal 短暂闪现 / toast（bg `#2DD4BF`）|
| Error / Rejected | `#E85A7E` 边框 + 错误文案 + CTA 按钮 |
| Disabled | opacity-40 + cursor-not-allowed |

---

## 列表行为

- **空状态**：必须有空状态提示（图标 + 文案 + CTA），文字用 `#8A8A9A`
- **列表项结构**：统一左-中-右布局（左: 主标识，中: 核心信息，右: 状态/操作）
- **长列表**：overflow-y-auto 固定高度容器，避免整页滚动失控
- **列表行 hover**：bg `#252536`

---

## 过渡（仅功能性）

- 按钮 hover/active：transition-all duration-150
- 抽屉/底部面板：transition-transform duration-200 ease-out
- Toast：fade + slide-up
- **禁止**无目的装饰动画

---

## 基础组件集

### 第一批（主干 + 分叉必需）
- `Button` — Primary(teal) / Danger(pink) / Secondary / Ghost × 五状态 × 三尺寸
- `Input` — 深色背景 + 浅色文字 + error state (pink border) + disabled
- `Card` — 统一圆角 + 面板色底 + 可选 border
- `Badge` — 状态色 + 全圆角
- `Modal` / `ConfirmDialog` — Quick Order 确认步骤 + 错误 CTA
- `Tabs` — 页面内区域切换（参照 TurboFlow 的 Market/Limit tab 风格）
- `SegmentedControl` — YES/NO 选择、Spend/Shares 切换（参照 Isolated/10x/One-way 风格）
- `Drawer` / `BottomSheet` — 分叉容器（深色背景）
- `Spinner` — 加载状态（teal 色）
- `Toast` — 操作反馈（success: teal / error: pink / info: 白底）

### 第二批（体验增强，按需实现）
- `Skeleton` — 深色背景上的 shimmer 骨架屏
- `EmptyState` — 空状态提示（图标 + 文案 + CTA）
- `Divider` — 统一分割线（`#252536`）
- `Pagination` / `LoadMore` — 桌面分页器 + 移动端加载更多
