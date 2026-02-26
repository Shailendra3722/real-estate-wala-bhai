# Premium Loading Animation - Integration Guide

## ✨ Quick Start

Add these two lines to the `<head>` section of **any HTML page**:

```html
<link rel="stylesheet" href="loading-animation.css">
<script src="loading-animation.js"></script>
```

That's it! The loading animation will automatically:
- ✅ Show on page load
- ✅ Hide when page is ready
- ✅ Look premium and minimal

---

## 🎨 What It Looks Like

**Design:**
- ✅ Pure white background (#ffffff)
- ✅ App name in center with purple gradient
- ✅ Slow fade-in/fade-out (3s cycle)
- ✅ Minimal 3-dot indicator
- ✅ Premium, not flashy

**Animation:**
- Subtle pulse from 100% → 40% → 100% opacity
- 3 second cycle (very slow and classy)
- Purple gradient text effect
- Minimalist dots with staggered animation

---

## 📖 Usage Examples

### 1. Auto Page Load (Already Active)
```html
<!-- Just include the files - automatic! -->
<link rel="stylesheet" href="loading-animation.css">
<script src="loading-animation.js"></script>
```

### 2. Manual Show/Hide
```javascript
// Show manually
PremiumLoader.show();

// Hide manually
PremiumLoader.hide();
```

### 3. Page Transitions
```javascript
// On button click
PremiumLoader.showForTransition('property-detail.html');

// In HTML
<button onclick="PremiumLoader.showForTransition('home.html')">
    Go Home
</button>
```

### 4. Wrap Async Operations
```javascript
// Show loading while fetching data
await PremiumLoader.wrapWithLoader(async () => {
    const response = await fetch('/api/properties');
    const data = await response.json();
    return data;
});
```

### 5. Transition Mode (Faster)
```javascript
// For quick page transitions (2s instead of 3s)
PremiumLoader.show(true); // true = transition mode
```

---

## 🔧 API Reference

### `PremiumLoader.show(isTransition)`
Shows the loading animation.
- **isTransition** (boolean): If true, uses faster 2s animation

### `PremiumLoader.hide()`
Hides the loading animation with fade-out effect.

### `PremiumLoader.showForTransition(targetUrl, delay)`
Shows loader and navigates to target URL after delay.
- **targetUrl** (string): URL to navigate to
- **delay** (number): Milliseconds to wait before navigation (default: 600ms)

### `PremiumLoader.wrapWithLoader(asyncFunction, minDisplayTime)`
Wraps an async function with loading animation.
- **asyncFunction** (function): Async function to execute
- **minDisplayTime** (number): Minimum display time in ms (default: 500ms)

---

## 📱 Responsive Design

**Desktop:**
- App name: 2.5rem
- Tagline: 0.95rem

**Tablet (< 768px):**
- App name: 2rem
- Tagline: 0.85rem

**Mobile (< 480px):**
- App name: 1.75rem

All sizes maintain premium look and readability.

---

## 🎨 Customization

### Change App Name
Edit `loading-animation.js` line 34-35:
```javascript
<div class="app-name">Your App Name</div>
<div class="app-tagline">Your Tagline</div>
```

### Change Colors
Edit `loading-animation.css`:
```css
/* Background */
background: #ffffff; /* Change to your color */

/* Text gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Change Animation Speed
Edit `loading-animation.css`:
```css
/* Slower: 4s or 5s */
animation: subtlePulse 4s ease-in-out infinite;

/* Faster: 2s */
animation: subtlePulse 2s ease-in-out infinite;
```

---

## ✅ Integration Checklist

- [x] `loading-animation.css` added to project
- [x] `loading-animation.js` added to project
- [x] Included in `home.html` (demo)
- [ ] Add to all other pages:
  - [ ] property-detail.html
  - [ ] search.html
  - [ ] map-explore.html
  - [ ] add-property-step1-6.html
  - [ ] agent-properties.html
  - [ ] etc.

**Copy these 2 lines to each page's `<head>`:**
```html
<link rel="stylesheet" href="loading-animation.css">
<script src="loading-animation.js"></script>
```

---

## 🚀 Demo Page

Open `loading-demo.html` to see all features in action:
- Manual show/hide
- Page transitions
- Async operations
- Transition mode
- Code examples

---

## ✨ Summary

**Files Created:**
1. `loading-animation.css` - Premium styles
2. `loading-animation.js` - Smart controller
3. `loading-demo.html` - Interactive demo

**Features:**
- ✅ White background
- ✅ App name in center
- ✅ Slow fade (3s cycle)
- ✅ Minimal & classy
- ✅ Auto page load
- ✅ Manual control
- ✅ Page transitions
- ✅ Async wrapper

**Zero configuration needed!** Just include the files and it works automatically. 🎉
