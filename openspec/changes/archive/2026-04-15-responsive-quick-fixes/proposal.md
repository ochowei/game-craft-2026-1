## Why

多個頁面在手機上有 padding 過大（p-8 = 32px 兩邊共 64px）、標題文字過大（text-5xl）、以及 header 按鈕與標題水平排列溢出等問題。這些是純 CSS class 調整，不涉及結構性重構，可以一次性快速修復，讓全站在手機上基本可讀可用。

## What Changes

- 全站頁面 padding 從固定 `p-8` 改為 `p-4 md:p-8`（手機 16px，桌機 32px）
- TemplateLibrary 標題從 `text-5xl` 改為 `text-3xl md:text-5xl`
- RulesEditor header 從 `flex justify-between items-end` 改為手機上垂直堆疊（按鈕換行到標題下方）
- TemplateLibrary filter bar 在手機上改善排列
- CardDesigner header 的 tab 切換在手機上改善排列

## Capabilities

### New Capabilities
- `responsive-layout-basics`: 全站基礎 responsive padding、typography、header layout 的規範

### Modified Capabilities

## Impact

- `src/components/RulesEditor.tsx`: header layout + padding
- `src/components/TemplateLibrary.tsx`: header layout + padding + title size + filter bar
- `src/components/CardDesigner.tsx`: header layout + padding
- `src/components/BoardEditor.tsx`: padding（inspector sidebar 留到後續 change）
- `src/components/Settings.tsx`: padding
