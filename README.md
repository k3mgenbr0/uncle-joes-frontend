# Uncle Joe's Coffee Company Frontend

## Contributors

- [Colten Brandt](https://github.com/brandt10)
- 

Customer-facing Vue 3 frontend for Uncle Joe's Coffee Company. The app uses Vue Router for navigation, Pinia for member auth state, a shared fetch-based API layer, and a warm responsive design system tailored to the Uncle Joe's palette.

## Current Feature Set

- Browse the full menu with search, category filters, grouped size toggles, and item detail pages
- Browse all store locations with city/state filters and detail pages
- See store amenities, weekly hours, and embedded map directions on location detail pages
- Respect backend ordering availability rules:
  - orderable stores behave normally
  - unavailable stores show `Coming Soon!`
  - unavailable stores do not appear in the pickup-store dropdown
- Log in with Coffee Club credentials using the deployed backend session flow
- View a member dashboard with:
  - points balance
  - favorites
  - preferred store
  - recent orders
- Build a pickup order with:
  - store selection
  - grouped product cards with size toggles
  - cart management
  - pickup time
  - special instructions
  - pay-in-store checkout
- View a confirmation screen after a successful order
- View previous orders, filter them by status, and open order detail pages
- Save and remove explicit favorite items from the order builder

## Project Structure

```text
src/
  assets/theme.css         Global theme tokens, layout utilities, and shared UI styles
  components/             Reusable UI building blocks and feature components
  router/index.js         Route definitions and auth guard logic
  services/               Shared API helper plus domain-specific API modules
  stores/auth.js          Pinia auth store with session restore logic
  utils/formatters.js     Shared formatting helpers for money, dates, times, hours, and labels
  views/                  Route-level pages
  App.vue                 App shell with navbar, routed content, and footer
  main.js                 App bootstrap
```

## Backend Integration

Base API:

- `https://uncle-joes-api-129124698283.us-central1.run.app`

Key frontend integration rules:

- All requests go through the shared helper in `src/services/api.js`
- Public endpoints use the deployed backend base URL directly
- Authenticated member endpoints use `credentials: "include"`
- The app expects a cookie-backed Coffee Club session for protected routes
- Location ordering rules come from:
  - `ordering_available`
  - `availability_status`
  - `availability_message`
- The pickup-store selector uses:
  - `GET /locations?orderable_only=true`
- Store-aware ordering uses:
  - `GET /locations/{location_id}/menu`

## Major Views

### Home

- Brand-forward landing page
- Quick entry points to menu, locations, orders, and member features

### Menu

- Search and category filtering
- Products grouped by drink name instead of one card per size
- Inline size toggles update visible price and calories
- Detail pages for single menu items

### Locations

- Search by city, state, or address
- State and city dropdown filters
- `Coming Soon!` treatment for stores that are not yet orderable
- Location detail pages with hours, amenities, phone, and map embed

### Orders

- Pickup-order builder
- Orderable-store dropdown only
- Store-specific menu loading
- Add/remove favorites
- Pickup time and special instructions
- Graceful handling of unavailable menu items and unavailable stores
- Previous order history with status filtering and sorting

### Dashboard

- Points balance
- Member details
- Preferred store
- Favorites
- Recent orders

## Setup

1. In `/Users/kyle816/GitHub/uncle-joes-frontend`, install dependencies with `npm install`.
2. Copy `.env.example` to `.env` if you want to override the API base URL.
3. Start the dev server with `npm run dev`.
4. Build for production with `npm run build`.

## Environment

The app supports a Vite environment override:

- `VITE_API_BASE_URL`

If omitted, the frontend defaults to the deployed Uncle Joe's backend URL.

## Data / Schema Notes

The frontend is intentionally defensive because backend responses have evolved during development. Normalization is isolated in the service layer so API adjustments stay localized.

Current response-shape assumptions the frontend supports:

- Menu/list endpoints may return a raw array or an object-wrapped collection
- Location/list endpoints may return a raw array or an object-wrapped collection
- Order responses may use `id` or `order_id`
- Menu item IDs may appear as `id`, `item_id`, or `menu_item_id`
- Points responses may use `points`, `balance`, `total_points`, or `current_points`
- Order items may be returned under `items`, `line_items`, or `order_items`
- Order detail/list responses may include:
  - `pickup_time`
  - `ready_by_estimate`
  - `submitted_at`
  - `order_status`
  - `estimated_prep_minutes`
  - `special_instructions`
  - `store_phone`

## Availability Rules

Store ordering availability now follows the backend contract:

- A store is orderable only when `ordering_available === true`
- Stores with `ordering_available === false` show `Coming Soon!`
- Unavailable stores are excluded from the pickup-store selector
- The order builder blocks submission if a stale store selection is no longer orderable
- If the backend still rejects the order, the backend's message is surfaced directly

Menu availability also respects store-level fields when present:

- `available_at_store`
- `store_availability_status`

If the backend marks a selected variant as unavailable at the chosen store, the frontend disables the add-to-cart action for that item.

## Error Handling Notes

- Auth failures are converted into member-friendly Coffee Club messages
- The orders page has fallback behavior if richer order-history payloads fail
- Pickup time selection is validated in the frontend against the selected store's hours before submission
- If backend schedule data and location-feed data disagree, the UI warns the user instead of pretending the frontend schedule is authoritative

## Manual Test Steps

### Browse Menu

1. Open the home page and click `Browse Menu`.
2. Confirm the menu page loads real items from the backend.
3. Use search and category filters.
4. Toggle between item sizes and confirm the visible price updates.
5. Open a menu item detail page and verify the product information loads.

### Browse Locations

1. Open `Locations`.
2. Search by city or state.
3. Use the `State` and `City` dropdowns.
4. Confirm orderable stores display normally.
5. Confirm non-orderable stores show `Coming Soon!`.
6. Open a location detail page and verify hours, contact info, amenities, and map render correctly.

### Login

1. Open `Login`.
2. Enter a valid Coffee Club email and the password `Coffee123!`.
3. Verify successful login establishes a session and unlocks protected routes.
4. Try invalid credentials and confirm an inline error is shown.

### Place a Pickup Order

1. Log in first.
2. Open `Orders`.
3. Confirm the pickup-store dropdown only includes orderable stores.
4. Select a store and verify menu items load from that store-specific endpoint.
5. Add items, set a pickup time, and optionally add instructions.
6. Place the order and confirm you are routed to the confirmation screen.

### View Previous Orders

1. Open the `Previous Orders` panel on the orders page.
2. Filter by search text and status.
3. Open an individual order detail page.
4. Confirm status, totals, items, and timing fields render when available.

### Dashboard

1. Visit `/dashboard`.
2. Confirm points, member details, favorites, and recent orders load.
3. Refresh the page and verify the session persists.

### Logout

1. Click `Logout` in the navbar.
2. Confirm protected routes become unavailable.
3. Try opening `/dashboard` directly and verify the app redirects to login.
