# Ikatancinta Express Backend Starter

Starter ini mengikuti kontrak yang sudah dipakai frontend pada repo utama.

Arsitektur utama yang direkomendasikan sekarang:

- `Frontend -> Express`
- `Express -> Google Apps Script Web App`
- `Google Apps Script -> Google Sheets + Google Drive`

Express tetap menjadi public API utama. Apps Script hanya berperan sebagai storage adapter internal.

Starter tetap mendukung fallback `memory`, serta opsi `google_sheets` / `google_drive` direct jika suatu saat ingin melepas Apps Script.

## Menjalankan

1. `cp .env.example .env`
2. isi env Apps Script
3. `npm install`
4. `npm run dev`

Server akan aktif di `http://127.0.0.1:3001/api`.

UI test API berbasis browser tersedia di:

- `http://127.0.0.1:3001/api/docs`

Playground ini berisi:

- tombol cepat `health`, `packages`, `themes`, `orders`
- form login admin untuk mendapatkan JWT
- input `x-admin-actor` untuk audit trail ringan
- tombol cepat `admin/summary`
- form kirim `wishes`
- form upload file
- textarea payload untuk submit order
- tombol update order admin
- form update status dan publish order

Swagger UI teknis tersedia di:

- `http://127.0.0.1:3001/api/swagger`

Spec OpenAPI JSON tersedia di:

- `http://127.0.0.1:3001/api/openapi.json`

## Provider

### Rekomendasi utama

- `DATA_STORE_PROVIDER=apps_script`
- `MEDIA_STORAGE_PROVIDER=apps_script`

### Opsi fallback

- `DATA_STORE_PROVIDER=memory|google_sheets`
- `MEDIA_STORAGE_PROVIDER=memory|google_drive`

## Env untuk Apps Script

- `APPS_SCRIPT_BASE_URL`
- `APPS_SCRIPT_SHARED_SECRET`
- `ADMIN_AUTH_EMAIL`
- `ADMIN_AUTH_PASSWORD`
- `ADMIN_JWT_SECRET`
- `ADMIN_JWT_EXPIRES_IN_SECONDS`
- `ADMIN_DISPLAY_NAME`
- `APPS_SCRIPT_TIMEOUT_MS`

Catatan:

- admin login memakai `POST /api/admin/auth/login`
- endpoint admin Express memakai `Authorization: Bearer <admin-jwt>`
- `ADMIN_JWT_SECRET` harus berbeda dari `APPS_SCRIPT_SHARED_SECRET`

## Env alternatif Google direct

- `GOOGLE_APPLICATION_CREDENTIALS`
- `GOOGLE_PROJECT_ID`
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SHEETS_ORDERS_SHEET`
- `GOOGLE_SHEETS_UPLOADS_SHEET`
- `GOOGLE_SHEETS_WISHES_SHEET`
- `GOOGLE_SHEETS_ORDER_EMAILS_SHEET`
- `GOOGLE_DRIVE_ROOT_FOLDER_ID`
- `GOOGLE_DRIVE_PUBLIC_READ`

## Cara kerja provider `apps_script`

- `POST /api/uploads`
  - Express menerima multipart dari frontend
  - frontend wajib mengirim `orderId`
  - Express encode file ke base64
  - Express kirim ke Apps Script action `createUpload`
  - Apps Script membuat atau memakai folder `DRIVE_ROOT_FOLDER_ID/<orderId>`
  - Apps Script upload ke Drive dan simpan metadata ke Sheets

- `POST /api/orders`
  - Express validasi paket dan tema
  - jika `invitationSlug` tidak dikirim, Express akan generate dari nama mempelai + `orderId`
  - Express kirim metadata order ke Apps Script action `createOrder`
  - Apps Script append row ke sheet `orders`

- `POST /api/invitations/:slug/wishes`
  - Express validasi body
  - Express resolve `slug` ke `order_id` bila slug itu adalah `invitation_slug`
  - Express kirim ke Apps Script action `createWish`
  - Apps Script append row ke sheet `wishes`

- `GET /api/invitations/:slug/list-wishes`
  - Express cek `slug` valid sebagai `invitation_slug` order atau `theme` slug
  - Express baca sheet `wishes` berdasarkan `invitation_slug`
  - response mengembalikan record wishes ter-normalisasi untuk kebutuhan referensi guest book

- `GET /api/orders` dan `GET /api/orders/:orderId`
  - Express membaca data melalui Apps Script action `listOrders` dan `getOrderById`
  - `GET /api/orders/:orderId` juga mengembalikan `uploads` dan `wishes` yang terkait

- `PATCH /api/orders/:orderId`
  - admin bisa mengubah status workflow order
  - status yang didukung: `pending`, `processing`, `published`, `done`, `cancelled`
  - backend menolak `orderId` dan `invitationSlug` yang duplikat saat create order
  - jika status diubah ke `published`, backend akan menjalankan publish guard yang sama seperti endpoint publish

- `PUT /api/orders/:orderId`
  - admin bisa mengedit payload order tanpa mengubah `orderId`
  - backend akan merge payload lama dengan patch baru lalu validasi ulang paket dan tema
  - perubahan dicatat ke audit ringan pada row order
  - order dengan status `done` atau `cancelled` tidak bisa diedit
  - order dengan status `published` masih boleh mengubah data mempelai, jadwal acara, sesi, dan cover
  - order dengan status `published` tidak bisa lagi mengubah paket, tema, dan `invitationSlug`

- `POST /api/orders/:orderId/publish`
  - endpoint eksplisit untuk publish invitation
  - publish akan ditolak jika field minimum belum lengkap
  - backend akan mengubah status ke `published`
  - response menyertakan `invitationUrl`

- `GET /api/admin/summary`
  - ringkasan cepat untuk dashboard admin
  - menghitung total order, upload, wishes, breakdown status, breakdown package tier, dan recent orders

## Endpoint public Express

- `GET /api/health`
- `GET /api/packages`
- `GET /api/themes`
- `GET /api/themes/:slug/invitations`
- `GET /api/invitations/:slug`
- `GET /api/invitations/:slug/list-wishes`
- `POST /api/invitations/:slug/wishes`
- `POST /api/uploads`
- `GET /api/uploads`
- `POST /api/orders`
- `GET /api/orders/:orderId`

Catatan:

- `GET /api/orders/:orderId` tetap public karena dipakai halaman konfirmasi order di frontend

## Endpoint admin Express

- `POST /api/admin/auth/login`
- `GET /api/admin/auth/me`
- `GET /api/orders`
- `PUT /api/orders/:orderId`
- `PATCH /api/orders/:orderId`
- `POST /api/orders/:orderId/publish`
- `POST /api/orders/email`
- `GET /api/admin/summary`

Semua endpoint admin terproteksi membutuhkan header berikut:

- `Authorization: Bearer <admin-jwt>`

Header opsional untuk audit ringan:

- `x-admin-actor: <nama-admin>`

## File starter Apps Script

Pasangan storage adapter untuk starter ini ada di folder:

- `google-apps-script-starter/`

## File bantu test

- `http/express-api.http`
- `http/apps-script.http`
- `http/openapi-docs.http`
- `.env.apps-script.ready.example`

## Catatan implementasi

- business rule paket tetap ada di Express
- Apps Script tidak dijadikan public API frontend
- starter ini belum menambahkan retry, queue, atau rate limit handling untuk Apps Script / Google API
- server akan `fail fast` saat startup jika provider aktif belum punya env yang wajib
