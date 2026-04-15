## Why

Top navigation bar 在手機上右側元素過多（save/cloud/settings 圖示、Export、使用者名稱+登出、avatar、Playtest），總寬度約 450px+ 超過手機螢幕寬度（375-430px），導致 avatar 被擠出可視區域或被 flex shrink 壓縮到不可見。

## What Changes

- 在 `md` breakpoint 以下，top nav 只顯示：logo + avatar + hamburger menu 按鈕
- 新增 hamburger dropdown menu，收納手機上隱藏的按鈕（save、cloud、settings、Export、Playtest、Logout）
- Avatar 在所有螢幕尺寸下永遠可見
- `md` breakpoint 以上維持現有 layout 不變

## Capabilities

### New Capabilities
- `mobile-nav-menu`: Hamburger menu component for mobile top navigation, including toggle state and dropdown panel with all hidden nav actions

### Modified Capabilities

## Impact

- `src/components/Layout.tsx`: top nav section 需要大幅調整 responsive classes 及新增 hamburger menu
- 無 API 或依賴變更
