# Menu Services Management Backend

A lightweight Node.js + Express API for managing categories, subcategories, items, addons, and bookings, with a dedicated **pricing engine** and **tax inheritance**.

## Overall architecture

The project follows a simple layering that keeps HTTP concerns separate from business rules:

- **`server.js`**
  - Express app bootstrap
  - Loads environment via `dotenv`
  - Connects to MongoDB
  - Mounts feature routes under `/api/*`

- **`routes/`**
  - Pure routing (URL → controller function)
  - Example: `routes/item.routes.js` defines CRUD + `GET /:id/price`

- **`controllers/`**
  - Request/response boundary
  - Extracts params/query/body
  - Maps service errors to HTTP responses

- **`services/`**
  - Business logic and validations
  - Pricing engine (`pricing.service.js`)
  - Tax inheritance resolver (`tax.service.js`)

- **`models/`**
  - Mongoose schemas + indexes
  - Relationship modeling via `ObjectId` references

**Why this structure?**
- It keeps the pricing/tax logic reusable (not tied to Express).
- Controllers stay thin; most behavior lives in services.
- Models remain the single “source of truth” for persistence rules (constraints/indexes).

## Data modeling decisions

This project uses MongoDB (via Mongoose) and models the domain around a menu/catalog:

### Category (`models/Category.model.js`)
- `name` (unique)
- `tax_applicable` (default `false`)
- `tax_percentage` (required only when `tax_applicable === true`)
- `is_active` soft-delete flag

### Subcategory (`models/Subcategory.model.js`)
- Belongs to a **Category**: `category: ObjectId → Category`
- `tax_applicable` is **optional** (can be `true`, `false`, or unset)
- `tax_percentage` optional
- Uniqueness: `(name, category)`

### Item (`models/item.model.js`)
- Belongs to **either** Category **or** Subcategory
  - enforced in service layer (`validateParent` in `services/item.service.js`)
  - `parent_type` stored as `CATEGORY | SUBCATEGORY` for clarity
- Pricing is stored as:
  - `pricing.type`: `STATIC | TIERED | COMPLIMENTARY | DISCOUNTED | DYNAMIC`
  - `pricing.config`: a flexible object (Mixed) that depends on the type
- Optional bookability:
  - `is_bookable` + `availability.days` + `availability.timeSlots`
- `addons`: array of Addon references
- Tax fields at item level are optional:
  - `tax_applicable` can be `true`, `false`, or unset
  - `tax_percentage` optional

Indexes:
- `(name, category)` and `(name, subcategory)` are unique (sparse) to reduce duplicates within the same parent.

### Addon (`models/Addon.model.js`)
- Belongs to an **Item**: `item: ObjectId → Item`
- `price` (>= 0)
- Optional `group` and `is_mandatory`
- Uniqueness: `(item, name)`

### Booking (`models/Booking.model.js`)
- Belongs to an **Item**: `item: ObjectId → Item`
- `date` + `startTime` + `endTime` (stored as strings for simplicity)
- `status`: `BOOKED | CANCELLED`
- Indexed by `(item, date, startTime, endTime)` for lookup.

## How tax inheritance is implemented

Tax is resolved through a dedicated resolver: `services/tax.service.js` → `resolveTax(item)`.

**Inheritance priority (highest → lowest):**
1. **Item**
2. **Subcategory**
3. **Category**

**Behavior details:**
- If `item.tax_applicable === true`, the item explicitly opts into tax and wins.
  - percentage used: `item.tax_percentage || 0`
- If `item.tax_applicable === false`, the item explicitly opts out of tax and wins.
- If item doesn’t specify tax:
  - If item has a subcategory:
    - If `subcategory.tax_applicable === true`, tax applies using `subcategory.tax_percentage || 0`
    - If `subcategory.tax_applicable === false`, tax does not apply
    - If subcategory doesn’t specify tax, resolver falls back to the subcategory’s category.
  - If item directly belongs to a category, category tax applies if `category.tax_applicable` is true.
- Default if nothing matches: **no tax**.

This gives flexibility to override tax at the lowest level (item), while still supporting sensible defaults at category level.

## How the pricing engine works

Pricing is computed by `services/pricing.service.js` → `calculateItemPrice({ itemId, addons, duration, time })`.

### Inputs
- `itemId` (required)
- `addons` (optional query list of addon ids)
- `duration` (required only for `TIERED` pricing)
- `time` (required only for `DYNAMIC` pricing)

### Pricing rule resolution
The item stores `pricing.type` and `pricing.config`. The engine selects logic via `switch(type)`:

- **STATIC**
  - config: `{ price }`
  - result: `basePrice = price`

- **COMPLIMENTARY**
  - no config
  - result: `basePrice = 0`

- **DISCOUNTED**
  - config: `{ basePrice, discountType: FLAT|PERCENT, discountValue }`
  - calculates discount amount and clamps final price to `>= 0`

- **TIERED**
  - config: `{ tiers: [{ upTo, price }, ...] }`
  - chooses the first tier where `duration <= upTo`
  - errors if no tier matches

- **DYNAMIC**
  - config: `{ windows: [{ start, end, price }, ...] }`
  - chooses the first window where `start <= time <= end`
  - errors if no window matches (“not available at this time”)

### Addons
If addon ids are provided:
- fetches active addons tied to this item: `Addon.find({ _id: { $in: addons }, item: itemId, is_active: true })`
- sums addon prices into `addonsTotal`

### Tax
- Computes `subtotal = basePrice + addonsTotal`
- Calls `resolveTax(item)`
- If applicable, computes tax as: `taxAmount = subtotal * (tax_percentage / 100)`

### Output
The endpoint returns a breakdown:
- applied pricing rule
- base price + discount (if any)
- addons total
- tax (applicable/percentage/amount)
- `grandTotal` (= subtotal)
- `finalPayable` (= subtotal + tax)

## API endpoints (high level)

- **Categories**: `/api/categories`
  - `POST /`, `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id` (soft)

- **Subcategories**: `/api/subcategories`
  - `POST /`, `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id` (soft)

- **Items**: `/api/items`
  - `POST /`, `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id` (soft)
  - `GET /:id/price?addons=a,b&duration=30&time=14:00`

- **Addons**: `/api/addons`
  - `POST /`
  - `GET /item/:itemId`
  - `PUT /:id`, `DELETE /:id` (soft)

- **Bookings**: `/api/bookings`
  - `GET /availability/:itemId?date=2026-01-17`
  - `POST /`

## Tradeoffs / simplifications

- **No authentication/authorization**: assumed trusted admin usage.
- **No transactions**: e.g. addon creation both creates addon and pushes to item; in real systems I’d wrap this with a transaction.
- **Time handling is simplified**:
  - `startTime/endTime/time` are strings; comparisons are lexical.
  - Works reliably if you always use `HH:MM` 24-hour format.
- **No currency/rounding strategy**:
  - prices are plain numbers; a production system would standardize rounding and currency.
- **No OpenAPI/Swagger + no tests**:
  - prioritized implementing the required pricing + tax logic end-to-end.

## How to run locally

### Prerequisites
- Node.js (LTS recommended)
- MongoDB (local or Atlas)

### Setup
1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root (do not commit it):

```bash
MONGO_URI=mongodb://127.0.0.1:27017/menu_services
PORT=8000
```

3. Start the server:

```bash
npm start
```

If you prefer auto-reload, run it in dev mode (nodemon):

```bash
npm run dev
```

4. Verify:
- `GET http://localhost:8000/` should return `API is running`

## Written reflections

### Why did you choose your database?
I chose **MongoDB** because the domain is document-friendly (categories/items/addons/bookings) and Mongoose lets me iterate quickly with schemas, indexes, and references without a heavy migration workflow.

### Three things you learned while building this
1. Designing a pricing engine is mostly about **clear contracts** (what inputs are needed per pricing type) and defensive validation.
2. “Tax inheritance” sounds simple, but you need to decide what **explicit false** means (it should override).
3. Even small booking logic needs careful thinking about **time overlap** and edge cases.

### The hardest technical or design challenge you faced
Keeping pricing flexible (different strategies) while still validating inputs enough to avoid invalid configurations (like tier overlaps or missing required query params for tiered/dynamic pricing).

### What you would improve or refactor if you had more time
- Add a proper **validation layer** (e.g., Zod/Joi) and consistent error responses.
- Add **tests** for pricing/tax edge cases and booking overlap scenarios.
- Improve time handling by storing times as minutes (ints) or real DateTimes, and enforcing a strict format.

