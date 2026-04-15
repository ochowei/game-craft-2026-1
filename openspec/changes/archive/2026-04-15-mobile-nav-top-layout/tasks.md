## 1. Mobile responsive hiding

- [x] 1.1 Add `hidden md:flex` to save/cloud/settings icon group (with its border-r and margins)
- [x] 1.2 Add `hidden md:block` to Export button
- [x] 1.3 Add `hidden md:flex` to user name/logout text block (keep avatar visible)
- [x] 1.4 Add `hidden md:inline-flex` to Playtest button
- [x] 1.5 Add `shrink-0` to avatar img to prevent flex compression

## 2. Hamburger menu button

- [x] 2.1 Add hamburger button (`menu` material icon) visible only on mobile (`md:hidden`)
- [x] 2.2 Add `useState` for menu open/close toggle

## 3. Dropdown panel

- [x] 3.1 Create dropdown panel below nav with all hidden actions (save, cloud, settings, Export, Playtest, Logout)
- [x] 3.2 Wire settings button in dropdown to `onScreenChange('settings')`
- [x] 3.3 Wire Logout in dropdown to `signOut`
- [x] 3.4 Add click-outside-to-close with `useRef` + `useEffect`
- [x] 3.5 Close dropdown on any action button tap

## 4. Verification

- [x] 4.1 Test on mobile viewport: only logo, avatar, hamburger visible
- [x] 4.2 Test hamburger open: all actions present and functional
- [x] 4.3 Test desktop viewport: layout unchanged
