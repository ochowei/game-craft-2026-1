## Context

CardDesigner 目前是 `flex h-full` 水平排列：左側卡片 grid (`flex-1`) + 右側 Card Inspector (`w-80`)。手機上 sidebar 佔滿螢幕，卡片區域被壓到不可用。需要在手機上將 inspector 改為 bottom sheet 模式。

## Goals / Non-Goals

**Goals:**
- 手機上 inspector 以 bottom sheet 形式呈現，可拖動展開/收起
- 桌機上維持現有 sidebar layout 不變
- Bottom sheet 包含 inspector 的所有內容（preview、tabs、form fields、save button）

**Non-Goals:**
- 不重新設計 inspector 的內容或表單
- 不處理卡片 grid 的 touch 交互（如拖拽排序）
- 不引入第三方 bottom sheet library

## Decisions

### 1. 純 CSS + React state 實作 bottom sheet

**選擇**: 用 `translateY` + `transition` 控制 bottom sheet 的滑動，`useState` 管理展開/收起狀態。不引入手勢庫。

**理由**: 兩個狀態（peek / expanded）用簡單的 click toggle 就夠了，不需要真正的拖動手勢。保持實作簡單，未來需要的話再加入 touch drag。

**替代方案**: 用 `framer-motion` 的 drag + snap，但專案目前只用 `motion/react` 做簡單動畫，bottom sheet drag 的複雜度不值得。

### 2. 兩個狀態：peek 和 expanded

**選擇**: 
- **peek**: 只露出一個 handle bar + "Card Inspector" 標題列（約 48px 高），固定在螢幕底部
- **expanded**: 展開到螢幕高度 ~70%，顯示完整 inspector 內容，內部可滾動

**理由**: 不需要中間態。用戶要嘛在看卡片 grid（peek），要嘛在編輯卡片（expanded）。

### 3. Inspector 內容共用，不複製 JSX

**選擇**: 將 inspector 的 JSX 抽成一個變數或 inline render，桌機用 `<aside>` 包裹，手機用 bottom sheet 包裹。同一份 JSX，兩種容器。

**理由**: 避免複製 140 行的 inspector JSX。用一個 `inspectorContent` 變數，桌機版和手機版各自用不同的 wrapper 渲染。

### 4. Floating action palette 在手機上隱藏

**選擇**: 加 `hidden md:flex` 隱藏。

**理由**: 在 bottom sheet peek 狀態下，palette 會跟 bottom sheet 的 handle 重疊。手機上這些操作可以移到未來的 context menu。

## Risks / Trade-offs

- **無真正拖動手勢**: peek/expanded 靠點擊切換，不是拖動。→ 可接受，行為清晰。未來可加 touch drag。
- **鍵盤彈出時的處理**: expanded 狀態下點擊 input 會彈出鍵盤，可能遮擋 bottom sheet。→ bottom sheet 設為 `max-h-[70vh]` 而非固定高度，讓系統自然處理 viewport 變化。
- **Bottom sheet 與 sidebar 的 z-index**: bottom sheet 需要高於卡片 grid 但低於 top nav。→ 用 `z-40`（top nav 是 `z-50`）。
