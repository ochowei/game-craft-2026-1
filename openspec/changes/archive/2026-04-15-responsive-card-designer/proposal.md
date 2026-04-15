## Why

CardDesigner 在手機上完全不可用：右側 Card Inspector sidebar 固定 `w-80` (320px)，在 375px 手機上佔了 85% 的螢幕寬度，卡片 grid 只剩 55px。Floating action palette 也會與內容衝突。需要將 inspector 改為 bottom sheet 模式，讓手機用戶可以正常瀏覽和編輯卡片。

## What Changes

- 手機上隱藏右側 Card Inspector sidebar
- 新增 bottom sheet 元件，從螢幕底部滑出，包含 inspector 的所有內容
- Bottom sheet 有兩個 snap 狀態：peek（露出標題列，可拖動展開）和 expanded（展開顯示完整 inspector）
- 手機上隱藏 floating action palette（避免與 bottom sheet 衝突）
- `md` breakpoint 以上維持現有 sidebar layout 不變

## Capabilities

### New Capabilities
- `card-inspector-bottom-sheet`: Bottom sheet 元件用於手機上顯示 Card Inspector，包含 peek/expanded 狀態、拖動手勢、點擊外部關閉

### Modified Capabilities

## Impact

- `src/components/CardDesigner.tsx`: 主要修改檔案，新增 bottom sheet 邏輯和 responsive 切換
- 無 API 或依賴變更
