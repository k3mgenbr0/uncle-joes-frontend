# Uncle Joe's Coffee Company Frontend

Production-ready Vue 3 frontend for Uncle Joe's Coffee Company. The app uses Vue Router for navigation, Pinia for member authentication state, Axios for API requests, and a warm responsive design system tailored to the provided brand palette.

## Project Structure

```text
src/
  assets/theme.css         Global theme tokens, layout utilities, and shared UI styles
  components/             Reusable UI building blocks and feature components
  router/index.js         Route definitions and dashboard auth guard
  services/               Centralized API client and feature-specific API helpers
  stores/auth.js          Pinia auth store with persistence restore
  views/                  Route-level pages
  App.vue                 App shell with navbar, routed content, and footer
  main.js                 App bootstrap
```

## Setup

1. In `/Users/kyle816/GitHub/uncle-joes-frontend`, install dependencies with `npm install`.
2. Copy `.env.example` to `.env` if you want to override the API base URL.
3. Start the dev server with `npm run dev`.
4. Build for production with `npm run build`.

## Assumptions

- `POST /login` accepts `{ email, password }`.
- Successful login returns either a member object directly or an object containing member data under fields such as `member`, `user`, or `data`.
- A member identifier may be returned as `id`, `member_id`, or a similar key.
- `GET /menu` and `GET /locations` may return either a raw array or an object wrapping an array.
- Member points responses may use keys such as `points`, `balance`, or `total_points`.
- Order history may include nested line items under keys such as `items`, `line_items`, or `order_items`.

The mapping and normalization logic is isolated in the service layer so response-shape tweaks stay localized.

## Manual Test Steps

### Browse Menu

1. Open the home page and click `Browse Menu`.
2. Confirm the menu page loads without crashing.
3. Use the search bar and category filter.
4. Verify loading, empty, and error states appear appropriately when data is unavailable or a request fails.

### Browse Locations

1. Open `Locations`.
2. Search by city or state.
3. Confirm location cards render available details and gracefully handle no results.

### Login

1. Open `Login`.
2. Enter a valid Coffee Club email and the password `Coffee123!`.
3. Verify successful login redirects to the dashboard and the navbar changes to `Logout`.
4. Try invalid credentials and confirm an inline error is shown.

### View Dashboard

1. Log in first.
2. Visit `/dashboard`.
3. Confirm points and order history widgets load independently.
4. Refresh the page and verify the session persists.

### Logout

1. Click `Logout` from the navbar.
2. Confirm the app clears member state and redirects away from protected content.
3. Try opening `/dashboard` directly and verify it redirects to login.
