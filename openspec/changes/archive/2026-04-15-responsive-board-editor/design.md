## Context

BoardEditor 是 `flex h-full`：左側 canvas 區域 (`flex-1`) 含固定 600×600 棋盤 + 右側 Inspector (`w-72`)。手機上 sidebar 佔 77% 螢幕、棋盤超出可視區域。CardDesigner 的 bottom sheet 模式已在前一個 change 中建立，這裡複用相同的模式。

## Goals / Non-Goals

**Goals:**
- Inspector 在手機上以 bottom sheet 呈現（peek/expanded，與 CardDesigner 相同模式）
- 棋盤在手機上縮放到可用寬度，維持正方形比例
- Canvas zoom controls 和 autosave indicator 在手機上正確定位
- 桌機上維持現有 layout 不變

**Non-Goals:**
- 不實作 pinch-to-zoom 觸控手勢
- 不改動 Inspector 的內容或表單
- 不抽出共用的 BottomSheet component（兩個 editor 各自 inline，等第三次使用時再抽）

## Decisions

### 1. Bottom sheet 與 CardDesigner 相同模式

**選擇**: `useState` toggle + `translateY` transition，peek (48px handle) / expanded (70vh)。

**理由**: 已驗證的模式，用戶在兩個 editor 間有一致的體驗。

### 2. 棋盤用 `w-full max-w-[600px] aspect-square` 替代固定尺寸

**選擇**: 移除 `w-[600px] h-[600px]`，改用 `w-full max-w-[600px] aspect-square`。桌機上 canvas 區域寬度 > 600px 時維持 600px；手機上自動縮到可用寬度。

**理由**: 純 CSS 解法，不需要 JavaScript 計算。`aspect-square` 確保正方形。棋盤內部的 11×11 grid 用的是百分比 (`w-full h-full`)，會自動跟著縮放。

**替代方案**: 用 CSS `transform: scale()` 保持 600px 然後縮放，但會導致棋盤內文字模糊，且需要 JS 計算 scale ratio。

### 3. Inspector 內容共用，不複製 JSX

**選擇**: 與 CardDesigner 相同，將 inspector JSX 抽成 `inspectorContent` 變數，桌機 sidebar 和手機 bottom sheet 共用。

### 4. Zoom controls 移到左下角（手機上）

**選擇**: 手機上 zoom controls 從 `bottom-8 left-1/2` 移到 `bottom-16 left-4`（避開 bottom sheet peek bar）。桌機維持置中。

**理由**: Bottom sheet peek bar 在底部中間，zoom controls 需要避開。左下角有空間且不會遮擋棋盤。

### 5. Autosave indicator 在手機上重新定位

**選擇**: 從 `fixed bottom-6 right-80` 改為 `fixed bottom-6 right-4 md:right-80`。

**理由**: `right-80` 假設右側有 sidebar (w-72)，手機上沒有 sidebar 就會定位到看不見的地方。

## Risks / Trade-offs

- **棋盤文字在手機上可能太小**: 600px 棋盤縮到 ~340px（去掉 sidebar + padding），內部文字會跟著等比縮小。→ 可接受，棋盤本身有 zoom controls，用戶可以放大。
- **Autosave indicator 可能與 bottom sheet 重疊**: `bottom-6 right-4` 在手機上可能被 bottom sheet peek bar 部分遮擋。→ 改為 `bottom-16 md:bottom-6` 往上移。
