## Context

`Layout.tsx` 的 top nav 在桌機上有完整的按鈕列（save/cloud/settings/Export/user info/avatar/Playtest），但在手機螢幕上這些元素總寬度超過螢幕，導致 avatar 被擠出可視區域。左側的 Project/Assets/History 已有 `hidden md:flex` 處理，但右側沒有對應的 responsive 處理。

## Goals / Non-Goals

**Goals:**
- Avatar 在所有螢幕尺寸下永遠可見
- 手機上 top nav 精簡為：logo + avatar + hamburger menu
- Hamburger menu dropdown 收納手機上隱藏的操作按鈕
- `md` (768px) 以上維持現有 layout 不變

**Non-Goals:**
- 不重新設計桌機版 nav layout
- 不改動 side navigation 的 responsive 行為
- 不新增動畫或 transition 效果（hamburger 開關除外）

## Decisions

### 1. 在 Layout.tsx 內實作，不抽出獨立 component

**選擇**: Hamburger menu 的 state 和 UI 直接寫在 Layout.tsx 內。

**理由**: 目前 Layout.tsx 只有 120 行，hamburger menu 邏輯簡單（一個 boolean state + click outside 關閉），不需要額外的 component 檔案。

### 2. 使用 React state + Tailwind responsive classes

**選擇**: `useState` 控制 menu 開關，Tailwind `md:hidden` / `hidden md:flex` 控制顯示切換。

**理由**: 專案已使用 Tailwind，不需引入額外 CSS-in-JS 或 headless UI library。breakpoint 用 `md` 與現有左側 nav 的 `hidden md:flex` 一致。

### 3. Dropdown panel 而非 slide-in drawer

**選擇**: 從 hamburger 按鈕下方彈出的 dropdown panel，而非從側邊滑入的 drawer。

**理由**: 實作簡單，不需要 portal 或 overlay，也不會與左側 sidebar 衝突。

## Risks / Trade-offs

- **Click outside 關閉邏輯**: 需要 `useEffect` + `addEventListener` 來偵測點擊外部關閉 menu。實作簡單但要記得 cleanup。→ 用 `useRef` + effect cleanup 處理。
- **Avatar 的 flex shrink**: 即使加了 hamburger，仍需確保 avatar 的 `img` 有 `shrink-0` 避免被壓縮。→ 加上 `flex-shrink-0` class。
