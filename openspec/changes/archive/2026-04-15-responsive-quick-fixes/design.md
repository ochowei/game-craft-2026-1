## Context

全站 5 個內容頁面都使用固定 `p-8` padding 和桌機優先的 header layout。手機上 padding 吃掉過多空間，header 按鈕與標題擠在一行溢出。這些都是 Tailwind class 層級的調整，不涉及 component 結構或 state 變更。

## Goals / Non-Goals

**Goals:**
- 所有頁面在 375px 手機上可讀、可操作
- 純 Tailwind responsive class 調整，不改 component 結構
- 統一使用 `md` (768px) 作為 breakpoint，與 Layout 一致

**Non-Goals:**
- 不處理 BoardEditor / CardDesigner 的 inspector sidebar（留給後續 change）
- 不改動 Layout sidebar 的寬度行為
- 不新增任何 state 或 JavaScript 邏輯

## Decisions

### 1. Padding 統一改為 `p-4 md:p-8`

所有頁面的外層 container padding 統一從 `p-8` 改為 `p-4 md:p-8`。手機上 16px padding，桌機上維持 32px。`pb-32` 底部 padding 保持不變（為 floating elements 留空間）。

### 2. Header 用 `flex-col md:flex-row` wrap

RulesEditor 和 CardDesigner 的 header 目前是 `flex justify-between items-end`，手機上會水平溢出。改為 `flex flex-col md:flex-row md:justify-between md:items-end gap-4`，讓按鈕在手機上換到標題下方。

### 3. 標題文字 responsive sizing

TemplateLibrary 的 `text-5xl` 在 375px 上約 48px，太大。改為 `text-3xl md:text-5xl`。其他頁面 `text-4xl` 在手機上尚可接受（36px），暫不調整。

## Risks / Trade-offs

- **視覺差異微小**: 這些都是 padding 和排列的微調，桌機上幾乎看不出變化。→ 低風險。
- **CardDesigner header tab**: 手機上 tab 按鈕文字可能需要縮小，但這批先不處理（inspector sidebar 問題更大，留給後續 change）。
