import { normalizeDriveAssetUrl } from "./assetUrl.js";

const PUBLIC_INVITATION_STATUSES = new Set(["published", "done"]);

function normalizeInvitationStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function buildEventDateTime(date, timeRange) {
  if (!date) return "2026-03-30T10:00:00+07:00";
  const startTime = String(timeRange || "10:00").split(" - ")[0].trim() || "10:00";
  return `${date}T${startTime}:00+07:00`;
}

function buildTimeRange(startTime, endTime) {
  if (!startTime && !endTime) return "09.00 - 10.00 WIB";
  const start = String(startTime || "09:00").replace(":", ".");
  const end = String(endTime || "10:00").replace(":", ".");
  return `${start} - ${end} WIB`;
}

export function buildInvitationSchema({ theme, packageConfig, invitationSlug, order, wishes }) {
  const coupleParts = String(theme?.couple || "Habib & Adiba")
    .split("&")
    .map((part) => part.trim());
  const groomName = coupleParts[0] || "Habib";
  const brideName = coupleParts[1] || "Adiba";
  const payload = order?.payload || {};
  const frontCoverPhoto = normalizeDriveAssetUrl(payload?.frontCoverImage?.url) || normalizeDriveAssetUrl(payload?.coverImage?.url) || theme?.thumbnail || theme?.image || "";
  const heroPhoto = normalizeDriveAssetUrl(payload?.coverImage?.url) || theme?.thumbnail || theme?.image || "";
  const bridePhoto = normalizeDriveAssetUrl(payload?.bride?.photo?.url) || heroPhoto;
  const groomPhoto = normalizeDriveAssetUrl(payload?.groom?.photo?.url) || heroPhoto;
  const akadCoverPhoto = normalizeDriveAssetUrl(payload?.akad?.coverImage?.url) || heroPhoto;
  const resepsiCoverPhoto = normalizeDriveAssetUrl(payload?.resepsi?.coverImage?.url) || akadCoverPhoto || heroPhoto;
  const closingBackgroundPhoto = normalizeDriveAssetUrl(payload?.closingBackgroundImage?.url) || heroPhoto;
  const galleryImages = Array.isArray(payload?.galleryImages)
    ? payload.galleryImages.map((image) => normalizeDriveAssetUrl(image?.url)).filter(Boolean)
    : [];
  const loveStories = Array.isArray(payload?.stories)
    ? payload.stories
        .map((story) => ({
          title: story?.title || "",
          text: story?.description || "",
          date: story?.date || "",
          photo: heroPhoto,
        }))
        .filter((story) => story.title || story.text || story.date)
    : [];
  const groom = payload?.groom || {};
  const bride = payload?.bride || {};
  const akad = payload?.akad || {};
  const resepsi = payload?.resepsi || {};
  const selectedTheme = payload?.selectedTheme || {};
  const music = payload?.music || {};
  const status = normalizeInvitationStatus(order?.status) || "processing";
  const publishedAt = order?.publishedAt || null;
  const completedAt = order?.completedAt || null;
  const isPublished = PUBLIC_INVITATION_STATUSES.has(status);

  return {
    status,
    orderStatus: status,
    isPublished,
    publishedAt,
    completedAt,
    invitation: {
      slug: invitationSlug || order?.invitationSlug || theme?.slug || "",
      orderId: order?.orderId || null,
      status,
      isPublished,
      publishedAt,
      completedAt,
    },
    guest: {
      name: "Nama Tamu",
      greetingLabel: "Kepada Bapak/Ibu/Saudara/i",
      code: "",
    },
    couple: {
      groom: {
        nameFull: groom?.fullname || `${groomName} Yulianto`,
        nickName: groom?.nickname || groomName,
        instagram: groom?.instagram || "ikatancinta.in",
        photo: groomPhoto,
        parentInfo: groom?.parents || "Putra dari Bapak Putra & Ibu Putri",
      },
      bride: {
        nameFull: bride?.fullname || `${brideName} Putri`,
        nickName: bride?.nickname || brideName,
        instagram: bride?.instagram || "ikatancinta.in",
        photo: bridePhoto,
        parentInfo: bride?.parents || "Putri dari Bapak Putra & Ibu Putri",
      },
      frontCoverPhoto,
      heroPhoto,
    },
    event: {
      dateISO: buildEventDateTime(akad?.date, akad?.startTime),
      akad: {
        date: akad?.date || "Senin, 30 Maret 2026",
        time: buildTimeRange(akad?.startTime, akad?.endTime),
        venueName: akad?.venue || "",
        address: akad?.address || "Simpang Lima Gumul, Kediri",
        mapsUrl: akad?.mapsLink || "https://maps.google.com",
        coverPhoto: akadCoverPhoto,
      },
      resepsi: {
        date: resepsi?.date || akad?.date || "Senin, 30 Maret 2026",
        time: buildTimeRange(resepsi?.startTime, resepsi?.endTime),
        venueName: resepsi?.venue || "",
        address: resepsi?.address || akad?.address || "Simpang Lima Gumul, Kediri",
        mapsUrl: resepsi?.mapsLink || akad?.mapsLink || "https://maps.google.com",
        coverPhoto: resepsiCoverPhoto,
      },
      livestream: {
        date: akad?.date || "Senin, 30 Maret 2026",
        time: buildTimeRange(akad?.startTime, akad?.endTime),
        platformLabel: "YouTube",
        url: "https://youtube.com",
      },
    },
    copy: {
      openingGreeting: selectedTheme?.name || theme?.title || "The Wedding Of",
      openingText: "Tanpa mengurangi rasa hormat, kami mengundang Anda untuk menghadiri acara pernikahan kami.",
      quote: payload?.quote || "",
      quoteSource: payload?.quoteSource || "",
      closingBackgroundPhoto,
      closingText: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.",
    },
    lovestory: packageConfig.capabilities.loveStory
      ? (loveStories.length ? loveStories : [
          { title: "Pertama Bertemu", text: "Kami pertama kali bertemu dalam sebuah acara kampus.", date: "2019", photo: heroPhoto },
          { title: "Menjalin Asmara", text: "Hubungan kami tumbuh menjadi komitmen yang lebih serius.", date: "2021", photo: heroPhoto },
        ])
      : [],
    gallery: galleryImages.slice(0, packageConfig.limits.galleryMax).filter(Boolean),
    features: {
      countdownEnabled: true,
      saveTheDateEnabled: true,
      digitalEnvelopeEnabled: packageConfig.capabilities.digitalEnvelope,
      digitalEnvelopeInfo: {
        bankList: packageConfig.capabilities.digitalEnvelope
          ? [{ bank: "BCA", accountNumber: "1234567890", accountName: "Ikatan Cinta" }]
          : [],
      },
      rsvpEnabled: packageConfig.capabilities.rsvp,
      livestreamEnabled: packageConfig.capabilities.livestream,
    },
    audio: {
      src: music?.mode === "upload" ? normalizeDriveAssetUrl(music?.file?.url) || "" : music?.previewUrl || "",
      autoplay: Boolean(music?.mode),
      loop: true,
    },
    wishes: {
      title: "Ucapan",
      initial: wishes,
    },
  };
}
