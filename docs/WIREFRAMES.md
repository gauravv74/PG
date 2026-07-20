# UniNest — Wireframes & UI Design System

## Design System

**Brand:** `brand` (indigo/blue `#173ff5`) primary, `accent` (coral `#ff5a5f`) for offers/CTAs.
**Type:** Plus Jakarta Sans. **Radius:** 2xl (cards), full (chips). **Shadows:** soft + card.
**Components:** `.btn-primary`, `.btn-outline`, `.btn-ghost`, `.card`, `.chip`, `.input`
(defined in `client/src/index.css`). Motion via Framer Motion (hover lift, section reveal).

## 1. Landing Page

```
┌───────────────────────────────────────────────────────────────┐
│  UniNest    [ search cities… ]     Explore  Host  ♥   Sign in   │  Navbar (sticky)
├───────────────────────────────────────────────────────────────┤
│                  Find your perfect student home                 │  Hero (gradient)
│           Verified accommodation near 5,000+ universities       │
│   ┌───────────────────────────────────────────────────────┐   │
│   │ [City][University][Area][Property]          ✨AI Search │   │  Hero search
│   │ 📍  studio under ₹15,000 near Pune University   [Search]│   │
│   └───────────────────────────────────────────────────────┘   │
│      Popular: Pune  London  Bengaluru  Melbourne  Mumbai       │
├───────────────────────────────────────────────────────────────┤
│  Trending cities        [ Pune ][ London ][ Mumbai ] …         │  city tiles
│  Featured properties    ‹ [card][card][card][card] ›           │  carousel
│  Top universities       [uni][uni][uni][uni]                   │
│  ╔═ Student discount — up to 10% off ═════════ [Claim] ╗       │  accent banner
│  Special offers         ‹ [card][card][card][card] ›           │
│  ┌ 12,400 homes · 40 cities · 5k unis · 250k students ┐        │  stats (brand bg)
│  Recommended for you    ‹ [card][card][card][card] ›           │
│  Recently viewed        ‹ [card][card] ›                       │
│  Why choose us          [verified][price match][secure][24/7]  │
│  Testimonials           [“…”][“…”][“…”]                        │
│  From the blog          [post][post][post]                     │
│  FAQs                   ▸ accordion…                            │
├───────────────────────────────────────────────────────────────┤
│  Footer: Explore · Company · Support · Hosting                 │
└───────────────────────────────────────────────────────────────┘
                                                   (💬 AI chat FAB)
```

## 2. Search Results

```
┌──────────────┬────────────────────────────────────────────────┐
│  FILTERS     │  128 homes found for "Pune"      [Sort: ▾]      │
│  Budget      │  ┌───────┐ ┌───────┐ ┌───────┐                 │
│  [min]-[max] │  │ img ♥ │ │ img ♥ │ │ img ♥ │                 │
│  Room type   │  │ name ★│ │ name ★│ │ name ★│   grid of cards │
│  ▢ studio    │  │ ₹/mo  │ │ ₹/mo  │ │ ₹/mo  │                 │
│  ▢ private…  │  └───────┘ └───────┘ └───────┘                 │
│  Amenities   │  … infinite scroll (IntersectionObserver) …    │
│  ▢ WiFi ▢ Gym│                                                 │
│  Distance ▭──│                                                 │
└──────────────┴────────────────────────────────────────────────┘
```

## 3. Property Detail

```
 Name  ★4.8 (120) · 📍 address · ✓Verified          [Share][Save]
 ┌──────────────┬────┬────┐   gallery (1 big + 4 thumbs)
 │              │    │    │   chips: 360° · Video · Floor plan · Bills incl.
 ├──────────────┴────┴────┤ ┌───────────────────────┐
 │ About this home        │ │ From ₹12,000 / month  │  sticky booking card
 │ Room types             │ │ [check-in][check-out] │
 │  ○ Studio   ₹14k  ▸    │ │ [ Instant book ]      │
 │  ○ Ensuite  ₹12k       │ │ [ Contact host ]      │
 │ What's nearby          │ │ Secure payment        │
 │  🚉 Metro 0.5km 6min   │ └───────────────────────┘
 │ Policies (cancel/dep.) │
 │ Reviews & ratings      │
 └────────────────────────┘
 Similar homes  [card][card][card][card]
```

## 4–8. Dashboards (Student / Host / Admin)

```
 Student:  [Active bookings][Wishlist][Loyalty][Referral]   + tab bar
 Host:     [Revenue][Bookings][Occupancy][Properties][Leads] + properties table
 Admin:    [Users][Properties][GMV][Commission][Verif.][Flags] + moderation
```

## 9. Messaging

```
 ┌ Conversations ─┬ Chat ───────────────────────────┐
 │ • Host — Pune  │  Host: Hi! ...        (read ✓✓)  │
 │   Studio 2     │  You: Is it available?          │
 │ • Host — London│  [typing…]                       │
 │                │  [📎 image][📎 pdf]  [type…][➤]  │
 └────────────────┴──────────────────────────────────┘
```
