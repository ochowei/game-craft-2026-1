## 1. localStorage Cache in ThemeProvider

- [x] 1.1 Add `localStorage.setItem('theme-resolved', resolved)` in the `useEffect` that applies the resolved theme to `<html>` in `src/contexts/ThemeContext.tsx`, wrapped in try/catch
- [x] 1.2 Update `ThemeContext.test.tsx` to verify localStorage is written when theme resolves

## 2. Inline Script in index.html

- [x] 2.1 Remove `class="dark"` from the `<html>` tag in `index.html`
- [x] 2.2 Add a blocking inline `<script>` in `<head>` that reads `localStorage.getItem('theme-resolved')` and sets `document.documentElement.className` (defaulting to `'dark'`), wrapped in try/catch

## 3. Verification

- [x] 3.1 Run full test suite — all tests pass
- [ ] 3.2 Set theme to light, refresh page, verify no dark flash
- [ ] 3.3 Clear localStorage, refresh page, verify dark default applies
- [ ] 3.4 Test in private/incognito mode — verify graceful fallback to dark
