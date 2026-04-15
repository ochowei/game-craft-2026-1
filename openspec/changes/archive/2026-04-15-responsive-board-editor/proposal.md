## Why

BoardEditor 在手機上完全不可用：右側 Inspector sidebar 固定 `w-72` (288px) 佔了 375px 手機的 77%，棋盤畫布固定 `w-[600px] h-[600px]` 遠超手機螢幕。canvas 區域只剩 87px，無法操作。需要將 inspector 改為 bottom sheet、棋盤改為自適應大小，讓手機用戶可以查看和編輯棋盤。

## What Changes

- 手機上隱藏右側 Inspector sidebar，改為 bottom sheet（複用 CardDesigner 已建立的模式）
- 棋盤畫布從固定 600×600 改為 responsive sizing，在手機上自動縮放到可用寬度
- Canvas zoom controls 在手機上重新定位（避免與 bottom sheet 衝突）
- Autosave status indicator 在手機上重新定位（目前 `right-80` 假設有 sidebar）
- `md` breakpoint 以上維持現有 layout 不變

## Capabilities

### New Capabilities
- `board-inspector-bottom-sheet`: Bottom sheet for Board Inspector on mobile, with peek/expanded states (same pattern as card-inspector-bottom-sheet)
- `responsive-board-canvas`: Board canvas responsive sizing, scaling from fixed 600×600 to viewport-aware dimensions on mobile

### Modified Capabilities

## Impact

- `src/components/BoardEditor.tsx`: 主要修改檔案，inspector bottom sheet + canvas responsive sizing
- 無 API 或依賴變更
