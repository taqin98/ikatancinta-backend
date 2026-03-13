const SAMPLE_ORDER = {
  orderId: "IKC-260313-1234",
  invitationSlug: "bima-anisa-ikc-260313-1234",
  customer: {
    name: "Anisa Putri",
    phone: "08123456789",
    email: "anisa@example.com",
    address: "Kediri",
  },
  groom: {
    fullname: "Bima Pratama",
    nickname: "Bima",
    parents: "Putra Bapak X & Ibu Y",
    instagram: "bimapratama",
  },
  bride: {
    fullname: "Anisa Putri",
    nickname: "Anisa",
    parents: "Putri Bapak A & Ibu B",
    instagram: "anisaputri",
  },
  akad: {
    date: "2026-03-30",
    startTime: "09:00",
    endTime: "10:00",
    venue: "Gedung Kediri",
    address: "Jl. Mawar No. 10",
    mapsLink: "https://maps.google.com",
  },
  resepsi: null,
  isReceptionEnabled: false,
  sessions: [],
  coverImage: null,
  galleryImages: [],
  stories: [],
  music: {
    mode: "list",
    trackId: "andmesh-cinta-luar-biasa",
    trackLabel: "Andmesh - Cinta Luar Biasa",
    previewUrl: "/audio/andmesh-cinta-luar-biasa.mp3",
  },
  selectedTheme: {
    slug: "timeless-promise",
    packageTier: "PREMIUM",
    presetId: "tlp-premium-001",
  },
  selectedPackage: {
    tier: "PREMIUM",
  },
};

export function renderApiPlaygroundHtml(apiBaseUrl) {
  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ikatancinta API Playground</title>
    <style>
      :root {
        --bg: #f5efe6;
        --panel: #fffdf8;
        --panel-alt: #f0e6d8;
        --text: #1f2933;
        --muted: #5f6c7b;
        --line: #d8cbb8;
        --accent: #1f6f5f;
        --accent-dark: #174f44;
        --danger: #a94438;
        --shadow: 0 18px 40px rgba(41, 32, 18, 0.08);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background:
          radial-gradient(circle at top left, rgba(31, 111, 95, 0.12), transparent 35%),
          linear-gradient(180deg, #f9f4ec 0%, var(--bg) 100%);
        color: var(--text);
        font-family: "Avenir Next", "Segoe UI", sans-serif;
      }
      .shell {
        width: min(1180px, calc(100vw - 32px));
        margin: 28px auto 40px;
      }
      .hero {
        display: grid;
        gap: 12px;
        grid-template-columns: 1.2fr 0.8fr;
        margin-bottom: 22px;
      }
      .panel {
        background: rgba(255, 253, 248, 0.92);
        border: 1px solid var(--line);
        border-radius: 24px;
        box-shadow: var(--shadow);
        backdrop-filter: blur(10px);
      }
      .hero-copy {
        padding: 26px 28px;
      }
      .eyebrow {
        display: inline-flex;
        padding: 7px 12px;
        border-radius: 999px;
        background: rgba(31, 111, 95, 0.12);
        color: var(--accent-dark);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      h1 {
        margin: 14px 0 10px;
        font-family: Georgia, "Times New Roman", serif;
        font-size: clamp(32px, 4vw, 52px);
        line-height: 1;
      }
      .lede {
        margin: 0;
        max-width: 58ch;
        color: var(--muted);
        line-height: 1.6;
      }
      .hero-meta {
        padding: 24px 24px 20px;
        display: grid;
        gap: 16px;
        align-content: space-between;
      }
      .meta-grid {
        display: grid;
        gap: 12px;
      }
      .meta-card {
        padding: 14px 16px;
        border-radius: 18px;
        background: var(--panel-alt);
        border: 1px solid var(--line);
      }
      .meta-card strong, .meta-card span { display: block; }
      .meta-card strong {
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
        margin-bottom: 6px;
      }
      .meta-card span {
        font-size: 15px;
        font-weight: 700;
        word-break: break-word;
      }
      .layout {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 20px;
      }
      .sidebar {
        padding: 20px;
        position: sticky;
        top: 20px;
        height: fit-content;
      }
      .sidebar h2,
      .content h2 {
        margin: 0 0 14px;
        font-size: 16px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .steps {
        display: grid;
        gap: 12px;
      }
      .step {
        padding: 14px 14px 12px;
        border-radius: 18px;
        background: var(--panel-alt);
        border: 1px solid var(--line);
      }
      .step strong {
        display: block;
        margin-bottom: 6px;
      }
      .step p {
        margin: 0;
        color: var(--muted);
        line-height: 1.5;
        font-size: 14px;
      }
      .content {
        display: grid;
        gap: 18px;
      }
      .section {
        padding: 22px;
      }
      .section-head {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 16px;
        margin-bottom: 16px;
      }
      .section-head p {
        margin: 6px 0 0;
        color: var(--muted);
        line-height: 1.5;
      }
      .grid {
        display: grid;
        gap: 14px;
      }
      .grid-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .field {
        display: grid;
        gap: 8px;
      }
      .field label {
        font-size: 13px;
        font-weight: 700;
        color: var(--muted);
      }
      input, select, textarea, button {
        font: inherit;
      }
      input, select, textarea {
        width: 100%;
        border: 1px solid var(--line);
        background: #fff;
        color: var(--text);
        border-radius: 14px;
        padding: 12px 14px;
      }
      textarea {
        min-height: 140px;
        resize: vertical;
        line-height: 1.5;
      }
      .button-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      button {
        border: 0;
        border-radius: 999px;
        padding: 12px 18px;
        background: var(--accent);
        color: #fff;
        font-weight: 700;
        cursor: pointer;
      }
      button.secondary {
        background: #ddcfba;
        color: #34291d;
      }
      button:disabled {
        opacity: 0.6;
        cursor: progress;
      }
      .note {
        padding: 12px 14px;
        border-radius: 16px;
        background: #faf6ef;
        border: 1px dashed var(--line);
        color: var(--muted);
        font-size: 14px;
        line-height: 1.5;
      }
      .status-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border-radius: 999px;
        background: #eef7f4;
        color: var(--accent-dark);
        font-weight: 700;
      }
      .status-chip.error {
        background: #fff0ee;
        color: var(--danger);
      }
      pre {
        margin: 0;
        padding: 18px;
        border-radius: 18px;
        background: #181818;
        color: #f7f4ef;
        overflow: auto;
        line-height: 1.5;
        font-size: 13px;
      }
      .response-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 10px;
      }
      .response-head small {
        color: var(--muted);
      }
      .pill-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .pill {
        padding: 7px 10px;
        border-radius: 999px;
        background: #efe4d3;
        font-size: 12px;
        font-weight: 700;
        color: #5d4630;
      }
      @media (max-width: 960px) {
        .hero,
        .layout,
        .grid-2 {
          grid-template-columns: 1fr;
        }
        .sidebar {
          position: static;
        }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <article class="panel hero-copy">
          <span class="eyebrow">API Playground</span>
          <h1>UI test backend yang langsung bisa dipakai.</h1>
          <p class="lede">Halaman ini dibuat untuk kebutuhan operasional. Anda tidak perlu baca kontrak OpenAPI dulu. Mulai dari cek health, lalu test katalog, wishes, upload file, dan submit order dari satu tempat.</p>
        </article>
        <aside class="panel hero-meta">
          <div class="meta-grid">
            <div class="meta-card">
              <strong>Base API</strong>
              <span id="apiBaseLabel">${apiBaseUrl}</span>
            </div>
            <div class="meta-card">
              <strong>Swagger</strong>
              <span><a href="/api/swagger" target="_blank" rel="noreferrer">Buka dokumentasi teknis</a></span>
            </div>
            <div class="meta-card">
              <strong>OpenAPI JSON</strong>
              <span><a href="/api/openapi.json" target="_blank" rel="noreferrer">Lihat spec mentah</a></span>
            </div>
            <div class="meta-card">
              <strong>Admin Login</strong>
              <span><input id="adminEmailInput" type="email" placeholder="email admin" /></span>
              <span style="margin-top:8px;display:block;"><input id="adminPasswordInput" type="password" placeholder="password admin" /></span>
              <span style="margin-top:8px;display:block;"><button type="button" id="adminLoginButton" class="secondary">Login Admin</button></span>
            </div>
            <div class="meta-card">
              <strong>Admin Actor</strong>
              <span><input id="adminActorInput" type="text" value="admin" placeholder="nama admin untuk audit trail" /></span>
            </div>
            <div class="meta-card">
              <strong>Admin Token</strong>
              <span><input id="adminTokenInput" type="text" placeholder="otomatis terisi setelah login" /></span>
            </div>
          </div>
          <div id="healthChip" class="status-chip">Memuat status backend...</div>
        </aside>
      </section>

      <section class="layout">
        <aside class="panel sidebar">
          <h2>Urutan Test</h2>
          <div class="steps">
            <div class="step">
              <strong>1. Cek backend</strong>
              <p>Pastikan provider dan tanggal respons muncul dari endpoint health.</p>
            </div>
            <div class="step">
              <strong>2. Lihat data master</strong>
              <p>Gunakan tombol paket, tema, atau order list untuk cek koneksi baca data.</p>
            </div>
            <div class="step">
              <strong>3. Kirim wish</strong>
              <p>Ini request tulis paling ringan untuk validasi Apps Script dan Sheets.</p>
            </div>
            <div class="step">
              <strong>4. Upload file</strong>
              <p>Upload cover, gallery, atau music untuk validasi Drive.</p>
            </div>
            <div class="step">
              <strong>5. Submit order</strong>
              <p>Mulai dari payload contoh, baru sesuaikan jika perlu.</p>
            </div>
          </div>
        </aside>

        <section class="content">
          <article class="panel section">
            <div class="section-head">
              <div>
                <h2>Status dan Master Data</h2>
                <p>Tombol cepat untuk endpoint baca. Ini cara tercepat memastikan backend merespons sesuai kontrak.</p>
              </div>
              <div class="pill-row">
                <span class="pill">GET /health</span>
                <span class="pill">GET /packages</span>
                <span class="pill">GET /themes</span>
                <span class="pill">GET /orders</span>
                <span class="pill">POST /admin/auth/login</span>
                <span class="pill">GET /admin/summary</span>
              </div>
            </div>
            <div class="button-row">
              <button type="button" data-fetch="/health">Cek Health</button>
              <button type="button" data-fetch="/packages">Lihat Packages</button>
              <button type="button" data-fetch="/themes">Lihat Themes</button>
              <button type="button" data-fetch="/admin/auth/me" data-admin="true">Cek Admin Me</button>
              <button type="button" data-fetch="/orders" data-admin="true">Lihat Orders</button>
              <button type="button" data-fetch="/admin/summary" data-admin="true">Ringkasan Admin</button>
            </div>
          </article>

          <article class="panel section">
            <div class="section-head">
              <div>
                <h2>Kirim Wish</h2>
                <p>Gunakan ini untuk tes tulis paling ringan ke endpoint invitation wishes.</p>
              </div>
              <span class="pill">POST /invitations/:slug/wishes</span>
            </div>
            <form id="wishForm" class="grid grid-2">
              <div class="field">
                <label for="wishSlug">Slug invitation</label>
                <input id="wishSlug" name="slug" value="bima-anisa-ikc-260313-1234" required />
              </div>
              <div class="field">
                <label for="wishAttendance">Attendance</label>
                <select id="wishAttendance" name="attendance">
                  <option value="hadir">hadir</option>
                  <option value="tidak_hadir">tidak_hadir</option>
                  <option value="masih_ragu">masih_ragu</option>
                </select>
              </div>
              <div class="field">
                <label for="wishName">Nama</label>
                <input id="wishName" name="name" value="Rina" required />
              </div>
              <div class="field">
                <label for="wishMessage">Pesan</label>
                <input id="wishMessage" name="message" value="Semoga lancar sampai hari H." required />
              </div>
              <div class="button-row">
                <button type="submit">Kirim Wish</button>
              </div>
            </form>
          </article>

          <article class="panel section">
            <div class="section-head">
              <div>
                <h2>Upload File</h2>
                <p>Upload file ke backend seperti flow frontend. Respons asset akan tampil di panel bawah.</p>
              </div>
              <span class="pill">POST /uploads</span>
            </div>
            <form id="uploadForm" class="grid grid-2">
              <div class="field">
                <label for="uploadOrderId">Order ID</label>
                <input id="uploadOrderId" name="orderId" value="IKC-260313-1234" required />
              </div>
              <div class="field">
                <label for="uploadKind">Jenis file</label>
                <select id="uploadKind" name="kind">
                  <option value="cover">cover</option>
                  <option value="gallery">gallery</option>
                  <option value="music">music</option>
                </select>
              </div>
              <div class="field">
                <label for="uploadName">Nama file override</label>
                <input id="uploadName" name="name" placeholder="opsional, default dari nama file" />
              </div>
              <div class="field" style="grid-column: 1 / -1;">
                <label for="uploadFile">Pilih file</label>
                <input id="uploadFile" name="file" type="file" required />
              </div>
              <div class="button-row">
                <button type="submit">Upload Sekarang</button>
              </div>
            </form>
          </article>

          <article class="panel section">
            <div class="section-head">
              <div>
                <h2>Submit Order</h2>
                <p>Payload contoh sudah valid untuk kontrak minimal. Pertahankan <code>orderId</code> yang sama dengan upload agar file masuk ke folder order yang benar.</p>
              </div>
              <span class="pill">POST /orders</span>
            </div>
            <div class="note">Jika ingin mengikuti flow frontend penuh, upload file dulu lalu tempel objek asset hasil upload ke field <code>coverImage</code> atau <code>galleryImages</code>.</div>
            <form id="orderForm" class="grid">
              <div class="field">
                <label for="orderPayload">Payload JSON</label>
                <textarea id="orderPayload" name="payload"></textarea>
              </div>
              <div class="button-row">
                <button type="submit">Kirim Order</button>
                <button type="button" class="secondary" id="updateOrderButton">Update Order Admin</button>
                <button type="button" class="secondary" id="resetOrderPayload">Reset Contoh</button>
              </div>
            </form>
          </article>

          <article class="panel section">
            <div class="section-head">
              <div>
                <h2>Update Status Order</h2>
                <p>Gunakan ini untuk workflow admin setelah order masuk. Status yang didukung: <code>pending</code>, <code>processing</code>, <code>published</code>, <code>done</code>, <code>cancelled</code>.</p>
              </div>
              <span class="pill">PATCH /orders/:orderId</span>
            </div>
            <form id="statusForm" class="grid grid-2">
              <div class="field">
                <label for="statusOrderId">Order ID</label>
                <input id="statusOrderId" name="orderId" value="IKC-260313-1234" required />
              </div>
              <div class="field">
                <label for="statusValue">Status</label>
                <select id="statusValue" name="status">
                  <option value="pending">pending</option>
                  <option value="processing">processing</option>
                  <option value="published">published</option>
                  <option value="done">done</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
              <div class="field" style="grid-column: 1 / -1;">
                <label for="statusNote">Catatan admin</label>
                <input id="statusNote" name="note" placeholder="opsional, mis. pembayaran sudah diverifikasi" />
              </div>
              <div class="button-row">
                <button type="submit">Update Status</button>
                <button type="button" class="secondary" id="publishOrderButton">Publish Order</button>
              </div>
            </form>
          </article>

          <article class="panel section">
            <div class="response-head">
              <div>
                <h2>Response Viewer</h2>
                <small id="responseMeta">Belum ada request.</small>
              </div>
              <button type="button" class="secondary" id="clearResponse">Bersihkan</button>
            </div>
            <pre id="responseOutput">Menunggu request pertama...</pre>
          </article>
        </section>
      </section>
    </main>

    <script>
      const apiBaseUrl = ${JSON.stringify(apiBaseUrl)};
      const sampleOrder = ${JSON.stringify(SAMPLE_ORDER, null, 2)};
      const healthChip = document.getElementById('healthChip');
      const responseMeta = document.getElementById('responseMeta');
      const responseOutput = document.getElementById('responseOutput');
      const orderPayload = document.getElementById('orderPayload');
      const adminEmailInput = document.getElementById('adminEmailInput');
      const adminPasswordInput = document.getElementById('adminPasswordInput');
      const adminActorInput = document.getElementById('adminActorInput');
      const adminTokenInput = document.getElementById('adminTokenInput');
      const uploadOrderIdInput = document.getElementById('uploadOrderId');
      const wishSlugInput = document.getElementById('wishSlug');
      const statusOrderIdInput = document.getElementById('statusOrderId');
      orderPayload.value = JSON.stringify(sampleOrder, null, 2);

      const storedAdminToken = sessionStorage.getItem('ikatancinta_admin_token');
      if (storedAdminToken) {
        adminTokenInput.value = storedAdminToken;
      }

      function persistAdminToken(token) {
        const normalized = String(token || '').trim();
        adminTokenInput.value = normalized;
        if (normalized) {
          sessionStorage.setItem('ikatancinta_admin_token', normalized);
        } else {
          sessionStorage.removeItem('ikatancinta_admin_token');
        }
      }

      function setResponse(label, payload, ok = true) {
        responseMeta.textContent = label;
        responseOutput.textContent = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
        responseOutput.style.color = ok ? '#f7f4ef' : '#ffb4aa';
      }

      function setHealth(payload, ok) {
        if (!ok) {
          healthChip.className = 'status-chip error';
          healthChip.textContent = 'Backend tidak merespons dengan benar';
          return;
        }

        healthChip.className = 'status-chip';
        healthChip.textContent = 'Backend aktif: ' + payload.providers.dataStore + ' / ' + payload.providers.mediaStorage;
      }

      function buildAdminHeaders() {
        const adminToken = String(adminTokenInput?.value || '').trim();
        const adminActor = String(adminActorInput?.value || '').trim();
        return {
          ...(adminToken ? { Authorization: 'Bearer ' + adminToken } : {}),
          ...(adminActor ? { 'x-admin-actor': adminActor } : {}),
        };
      }

      async function request(path, options = {}) {
        const startedAt = Date.now();
        const nextOptions = {
          ...options,
          headers: {
            ...(options.headers || {}),
            ...(options.admin ? buildAdminHeaders() : {}),
          },
        };
        const response = await fetch(apiBaseUrl + path, nextOptions);
        const text = await response.text();
        let data = text;

        try {
          data = text ? JSON.parse(text) : {};
        } catch (_error) {
          data = text;
        }

        const duration = Date.now() - startedAt;
        const label = (options.method || 'GET') + ' ' + path + ' [' + response.status + '] ' + duration + 'ms';
        setResponse(label, data, response.ok);
        return { response, data };
      }

      async function loadHealth() {
        try {
          const { response, data } = await request('/health');
          setHealth(data, response.ok);
        } catch (error) {
          setHealth(null, false);
          setResponse('GET /health [network-error]', { success: false, message: error.message }, false);
        }
      }

      document.querySelectorAll('[data-fetch]').forEach((button) => {
        button.addEventListener('click', async () => {
          button.disabled = true;
          try {
            await request(button.getAttribute('data-fetch'), {
              admin: button.getAttribute('data-admin') === 'true',
            });
          } finally {
            button.disabled = false;
          }
        });
      });

      document.getElementById('adminLoginButton').addEventListener('click', async () => {
        const button = document.getElementById('adminLoginButton');
        button.disabled = true;
        try {
          const payload = {
            email: String(adminEmailInput.value || '').trim(),
            password: String(adminPasswordInput.value || ''),
          };
          const { response, data } = await request('/admin/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify(payload),
          });
          if (response.ok && data?.data?.accessToken) {
            persistAdminToken(data.data.accessToken);
            if (!adminActorInput.value.trim() && data.data.admin?.name) {
              adminActorInput.value = data.data.admin.name;
            }
          }
        } finally {
          button.disabled = false;
        }
      });

      document.getElementById('wishForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const slug = String(form.get('slug') || '').trim();
        const payload = {
          name: String(form.get('name') || '').trim(),
          attendance: String(form.get('attendance') || '').trim(),
          message: String(form.get('message') || '').trim(),
        };

        const submitter = event.submitter;
        if (submitter) submitter.disabled = true;
        try {
          await request('/invitations/' + encodeURIComponent(slug) + '/wishes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify(payload),
          });
        } finally {
          if (submitter) submitter.disabled = false;
        }
      });

      document.getElementById('uploadForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const fileInput = document.getElementById('uploadFile');
        const file = fileInput.files && fileInput.files[0];

        if (!file) {
          setResponse('POST /uploads [client-error]', { success: false, message: 'Pilih file terlebih dahulu.' }, false);
          return;
        }

        const payload = new FormData();
        payload.set('file', file);
        payload.set('orderId', String(form.get('orderId') || '').trim());
        payload.set('kind', String(form.get('kind') || 'cover'));
        payload.set('name', String(form.get('name') || '').trim() || file.name);
        payload.set('mimeType', file.type || 'application/octet-stream');
        payload.set('size', String(file.size || 0));

        const submitter = event.submitter;
        if (submitter) submitter.disabled = true;
        try {
          await request('/uploads', {
            method: 'POST',
            body: payload,
          });
        } finally {
          if (submitter) submitter.disabled = false;
        }
      });

      document.getElementById('orderForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitter = event.submitter;
        if (submitter) submitter.disabled = true;

        try {
          const payload = JSON.parse(orderPayload.value);
          await request('/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify(payload),
          });
        } catch (error) {
          setResponse('POST /orders [client-error]', { success: false, message: error.message }, false);
        } finally {
          if (submitter) submitter.disabled = false;
        }
      });

      document.getElementById('updateOrderButton').addEventListener('click', async () => {
        const button = document.getElementById('updateOrderButton');
        button.disabled = true;
        try {
          const payload = JSON.parse(orderPayload.value);
          const orderId = String(payload.orderId || '').trim();
          if (!orderId) {
            setResponse('PUT /orders/:orderId [client-error]', { success: false, message: 'orderId wajib ada di payload JSON.' }, false);
            return;
          }

          await request('/orders/' + encodeURIComponent(orderId), {
            method: 'PUT',
            admin: true,
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify(payload),
          });
        } catch (error) {
          setResponse('PUT /orders/:orderId [client-error]', { success: false, message: error.message }, false);
        } finally {
          button.disabled = false;
        }
      });

      document.getElementById('statusForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const orderId = String(form.get('orderId') || '').trim();
        const status = String(form.get('status') || '').trim();
        const note = String(form.get('note') || '').trim();
        const submitter = event.submitter;
        if (submitter) submitter.disabled = true;
        try {
          await request('/orders/' + encodeURIComponent(orderId), {
            method: 'PATCH',
            admin: true,
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({ status, note }),
          });
        } finally {
          if (submitter) submitter.disabled = false;
        }
      });

      document.getElementById('publishOrderButton').addEventListener('click', async () => {
        const orderId = String(statusOrderIdInput.value || '').trim();
        const button = document.getElementById('publishOrderButton');
        button.disabled = true;
        try {
          await request('/orders/' + encodeURIComponent(orderId) + '/publish', {
            method: 'POST',
            admin: true,
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              note: String(document.getElementById('statusNote')?.value || '').trim(),
            }),
          });
        } finally {
          button.disabled = false;
        }
      });

      document.getElementById('resetOrderPayload').addEventListener('click', () => {
        orderPayload.value = JSON.stringify(sampleOrder, null, 2);
        uploadOrderIdInput.value = sampleOrder.orderId;
        statusOrderIdInput.value = sampleOrder.orderId;
        wishSlugInput.value = sampleOrder.invitationSlug;
      });

      uploadOrderIdInput.addEventListener('input', () => {
        try {
          const payload = JSON.parse(orderPayload.value);
          payload.orderId = uploadOrderIdInput.value.trim();
          orderPayload.value = JSON.stringify(payload, null, 2);
          statusOrderIdInput.value = payload.orderId || '';
        } catch (_error) {
          // Ignore invalid JSON while user is editing.
        }
      });

      document.getElementById('clearResponse').addEventListener('click', () => {
        responseMeta.textContent = 'Belum ada request.';
        responseOutput.textContent = 'Menunggu request pertama...';
        responseOutput.style.color = '#f7f4ef';
      });

      loadHealth();
    </script>
  </body>
</html>`;
}
