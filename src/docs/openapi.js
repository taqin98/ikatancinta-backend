import { env } from "../config/env.js";

export function buildOpenApiSpec(publicBaseUrl = env.publicBaseUrl) {
  return {
    openapi: "3.0.3",
    info: {
      title: "Ikatancinta Express API",
      version: "0.1.0",
      description:
        "UI dokumentasi dan test API untuk backend Express Ikatancinta. Frontend publik tetap mengarah ke Express; persistence bisa memakai Apps Script, Google direct, atau memory.",
    },
    servers: [
      {
        url: `${String(publicBaseUrl || env.publicBaseUrl).replace(/\/+$/, "")}/api`,
        description: "Express backend",
      },
    ],
    tags: [
      { name: "System" },
      { name: "Packages" },
      { name: "Themes" },
      { name: "Invitations" },
      { name: "Uploads" },
      { name: "Orders" },
      { name: "Admin" },
    ],
    components: {
      securitySchemes: {
        AdminBearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT admin dari endpoint login Express.",
        },
      },
    },
    paths: {
      "/admin/auth/login": {
        post: {
          tags: ["Admin"],
          summary: "Login admin and receive JWT",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", example: "admin@example.com" },
                    password: { type: "string", example: "super-secret-password" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Admin login success" },
            401: { description: "Admin login failed" },
            422: { description: "email and password are required" },
          },
        },
      },
      "/admin/auth/me": {
        get: {
          tags: ["Admin"],
          summary: "Get current admin profile",
          security: [{ AdminBearerAuth: [] }],
          responses: {
            200: { description: "Current admin profile" },
            401: { description: "Admin token invalid or missing" },
          },
        },
      },
      "/health": {
        get: {
          tags: ["System"],
          summary: "Health check",
          responses: {
            200: {
              description: "Backend status",
              content: {
                "application/json": {
                  example: {
                    success: true,
                    service: "ikatancinta-express-backend-starter",
                    providers: {
                      dataStore: env.dataStoreProvider,
                      mediaStorage: env.mediaStorageProvider,
                    },
                    date: new Date().toISOString(),
                  },
                },
              },
            },
          },
        },
      },
      "/packages": {
        get: {
          tags: ["Packages"],
          summary: "List package catalog",
          responses: {
            200: {
              description: "Package list",
            },
          },
        },
      },
      "/themes": {
        get: {
          tags: ["Themes"],
          summary: "List themes",
          parameters: [
            { name: "packageTier", in: "query", schema: { type: "string", example: "PREMIUM" } },
            { name: "slug", in: "query", schema: { type: "string" } },
            { name: "presetId", in: "query", schema: { type: "string" } },
            { name: "status", in: "query", schema: { type: "string", example: "active" } },
          ],
          responses: {
            200: {
              description: "Theme list",
            },
          },
        },
      },
      "/themes/{slug}/invitations": {
        get: {
          tags: ["Themes"],
          summary: "List invitations by theme slug",
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string", example: "timeless-promise" } }],
          responses: {
            200: { description: "Invitation list for a theme" },
            404: { description: "Theme not found" },
          },
        },
      },
      "/invitations/{slug}": {
        get: {
          tags: ["Invitations"],
          summary: "Get invitation schema by slug",
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string", example: "timeless-promise" } }],
          responses: {
            200: { description: "Invitation schema" },
            404: { description: "Invitation theme not found" },
          },
        },
      },
      "/invitations/{slug}/wishes": {
        post: {
          tags: ["Invitations"],
          summary: "Create invitation wish",
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string", example: "timeless-promise" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "attendance", "message"],
                  properties: {
                    name: { type: "string", example: "Rina" },
                    attendance: { type: "string", example: "hadir" },
                    message: { type: "string", example: "Semoga lancar sampai hari H." },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Wish accepted" },
            404: { description: "Invitation theme not found" },
          },
        },
      },
      "/uploads": {
        get: {
          tags: ["Uploads"],
          summary: "List uploaded assets",
          responses: {
            200: { description: "Upload list" },
          },
        },
        post: {
          tags: ["Uploads"],
          summary: "Upload media asset",
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["file", "orderId", "kind", "name"],
                  properties: {
                    file: { type: "string", format: "binary" },
                    orderId: { type: "string", example: "IKC-260313-1234" },
                    kind: { type: "string", example: "cover" },
                    name: { type: "string", example: "cover.jpg" },
                    mimeType: { type: "string", example: "image/jpeg" },
                    size: { type: "integer", example: 345678 },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Upload created" },
            400: { description: "File is required" },
          },
        },
      },
      "/orders": {
        get: {
          tags: ["Admin"],
          summary: "List orders for admin",
          security: [{ AdminBearerAuth: [] }],
          parameters: [
            { name: "status", in: "query", schema: { type: "string", example: "processing" } },
            { name: "packageTier", in: "query", schema: { type: "string", example: "PREMIUM" } },
            { name: "themeSlug", in: "query", schema: { type: "string", example: "timeless-promise" } },
          ],
          responses: {
            200: { description: "Order list" },
            401: { description: "Admin authentication failed" },
          },
        },
        post: {
          tags: ["Orders"],
          summary: "Create order",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    orderId: { type: "string", example: "IKC-260313-1234" },
                    invitationSlug: { type: "string", example: "bima-anisa-ikc-260313-1234" },
                    customer: { type: "object" },
                    groom: { type: "object" },
                    bride: { type: "object" },
                    akad: { type: "object" },
                    resepsi: { type: ["object", "null"] },
                    isReceptionEnabled: { type: "boolean", example: false },
                    sessions: { type: "array", items: { type: "object" } },
                    coverImage: { type: "object" },
                    galleryImages: { type: "array", items: { type: "object" } },
                    stories: { type: "array", items: { type: "object" } },
                    music: { type: "object" },
                    selectedTheme: {
                      type: "object",
                      properties: {
                        slug: { type: "string", example: "timeless-promise" },
                        packageTier: { type: "string", example: "PREMIUM" },
                        presetId: { type: "string", example: "tlp-premium-001" },
                      },
                    },
                    selectedPackage: {
                      type: "object",
                      properties: {
                        tier: { type: "string", example: "PREMIUM" },
                      },
                    },
                  },
                },
                example: {
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
                  coverImage: {
                    assetId: "asset_cover_123",
                    kind: "cover",
                    name: "cover.jpg",
                    mimeType: "image/jpeg",
                    size: 345678,
                    url: "https://drive.google.com/uc?export=view&id=cover123",
                  },
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
                },
              },
            },
          },
          responses: {
            201: { description: "Order created" },
            404: { description: "Theme not found" },
            422: { description: "Theme/package mismatch" },
          },
        },
      },
      "/orders/{orderId}": {
        get: {
          tags: ["Orders"],
          summary: "Get order by id",
          parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string", example: "IKC-260312-1234" } }],
          responses: {
            200: { description: "Order detail" },
            404: { description: "Order not found" },
          },
        },
        put: {
          tags: ["Admin"],
          summary: "Edit order payload for admin",
          security: [{ AdminBearerAuth: [] }],
          parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string", example: "IKC-260312-1234" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  description: "Partial atau full payload order. Backend akan merge dengan payload lama lalu validasi ulang tema dan paket.",
                  properties: {
                    invitationSlug: { type: "string", example: "bima-anisa-ikc-260312-1234" },
                    customer: { type: "object" },
                    groom: { type: "object" },
                    bride: { type: "object" },
                    akad: { type: "object" },
                    resepsi: { type: ["object", "null"] },
                    isReceptionEnabled: { type: "boolean" },
                    sessions: { type: "array", items: { type: "object" } },
                    coverImage: { type: "object" },
                    galleryImages: { type: "array", items: { type: "object" } },
                    stories: { type: "array", items: { type: "object" } },
                    music: { type: "object" },
                    selectedTheme: { type: "object" },
                    selectedPackage: { type: "object" },
                    note: { type: "string", example: "Admin memperbaiki data acara." },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Order updated" },
            404: { description: "Order not found" },
            401: { description: "Admin authentication failed" },
            422: { description: "Theme/package mismatch or invalid update payload" },
            409: { description: "Duplicate invitation slug" },
          },
        },
        patch: {
          tags: ["Admin"],
          summary: "Update order status",
          security: [{ AdminBearerAuth: [] }],
          parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string", example: "IKC-260312-1234" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: {
                    status: {
                      type: "string",
                      enum: ["pending", "processing", "published", "done", "cancelled"],
                      example: "published",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Order status updated" },
            404: { description: "Order not found" },
            401: { description: "Admin authentication failed" },
            422: { description: "Invalid status" },
          },
        },
      },
      "/orders/{orderId}/publish": {
        post: {
          tags: ["Admin"],
          summary: "Publish order invitation",
          security: [{ AdminBearerAuth: [] }],
          parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string", example: "IKC-260312-1234" } }],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    note: { type: "string", example: "Order siap live setelah diverifikasi." },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Order published" },
            404: { description: "Order not found" },
            401: { description: "Admin authentication failed" },
            422: { description: "Order is not ready to publish" },
          },
        },
      },
      "/orders/email": {
        post: {
          tags: ["Admin"],
          summary: "Queue order email",
          security: [{ AdminBearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    orderId: { type: "string", example: "IKC-260312-1234" },
                    customer: {
                      type: "object",
                      properties: {
                        email: { type: "string", example: "anisa@example.com" },
                      },
                    },
                    selectedTheme: { type: "object" },
                    selectedPackage: { type: "object" },
                    summary: { type: "object" },
                  },
                },
              },
            },
          },
          responses: {
            202: { description: "Email notification queued" },
            401: { description: "Admin authentication failed" },
          },
        },
      },
      "/admin/summary": {
        get: {
          tags: ["Admin"],
          summary: "Get admin dashboard summary",
          security: [{ AdminBearerAuth: [] }],
          responses: {
            200: { description: "Summary metrics" },
            401: { description: "Admin authentication failed" },
          },
        },
      },
    },
  };
}
