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

function normalizeText(value) {
  return String(value || "").trim();
}

function inferLivestreamPlatformLabel(url, fallback = "") {
  const normalizedUrl = normalizeText(url).toLowerCase();
  if (normalizedUrl.includes("youtube.com") || normalizedUrl.includes("youtu.be")) return "YouTube";
  if (normalizedUrl.includes("instagram.com")) return "Instagram";
  if (normalizedUrl.includes("facebook.com") || normalizedUrl.includes("fb.watch")) return "Facebook";
  if (normalizedUrl.includes("zoom.us")) return "Zoom";
  if (normalizedUrl.includes("meet.google.com")) return "Google Meet";
  if (normalizedUrl.includes("tiktok.com")) return "TikTok";
  if (normalizedUrl.includes("twitch.tv")) return "Twitch";
  return normalizeText(fallback) || "Livestream";
}

function normalizeAssetPayload(asset, fallbackKind = "file") {
  if (!asset) return null;

  if (typeof asset === "string") {
    const url = normalizeDriveAssetUrl(asset);
    return url ? { assetId: null, kind: fallbackKind, name: "asset", mimeType: "", size: null, url } : null;
  }

  if (typeof asset !== "object") return null;

  const url = normalizeDriveAssetUrl(asset?.url || asset?.src || "");
  const assetId = typeof asset?.assetId === "string" ? asset.assetId : null;
  if (!url && !assetId) return null;

  return {
    assetId,
    kind: typeof asset?.kind === "string" ? asset.kind : fallbackKind,
    name: typeof asset?.name === "string" ? asset.name : "asset",
    mimeType: typeof asset?.mimeType === "string" ? asset.mimeType : "",
    size: Number.isFinite(asset?.size) ? asset.size : asset?.size ? Number(asset.size) : null,
    url: url || null,
  };
}

function normalizeStoryPayload(story, fallbackPhoto) {
  if (!story || typeof story !== "object") return null;
  const photo = normalizeAssetPayload(story?.photo, "love-story") || normalizeAssetPayload(fallbackPhoto, "love-story");
  return {
    title: story?.title || "",
    description: story?.description || story?.text || story?.story || "",
    text: story?.text || story?.description || story?.story || "",
    date: story?.date || "",
    photo,
  };
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
  const saveTheDateBackgroundPhoto = normalizeDriveAssetUrl(payload?.saveTheDateBackgroundImage?.url) || heroPhoto;
  const wishesBackgroundPhoto = normalizeDriveAssetUrl(payload?.wishesBackgroundImage?.url) || heroPhoto;
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
          photo: normalizeDriveAssetUrl(story?.photo?.url) || heroPhoto,
        }))
        .filter((story) => story.title || story.text || story.date)
    : [];
  const groom = payload?.groom || {};
  const bride = payload?.bride || {};
  const akad = payload?.akad || {};
  const resepsi = payload?.resepsi || {};
  const selectedTheme = payload?.selectedTheme || {};
  const music = payload?.music || {};
  const giftPayload = payload?.gift || {};
  const giftBankList = Array.isArray(giftPayload.bankList)
    ? giftPayload.bankList
        .filter((item) => item?.bank || item?.account || item?.name)
        .map((item) => ({
          bank: item.bank || "",
          account: item.account || item.accountNumber || "",
          name: item.name || item.accountName || "",
        }))
    : [];
  const giftShipping = giftPayload.shipping || {};
  const hasGiftData = giftBankList.length > 0 || Boolean(giftShipping.recipient || giftShipping.phone || giftShipping.address);
  const status = normalizeInvitationStatus(order?.status) || "processing";
  const publishedAt = order?.publishedAt || null;
  const completedAt = order?.completedAt || null;
  const isPublished = PUBLIC_INVITATION_STATUSES.has(status);
  const rawStories = Array.isArray(payload?.stories)
    ? payload.stories.map((story) => normalizeStoryPayload(story, heroPhoto)).filter(Boolean)
    : [];
  const rawGalleryImages = Array.isArray(payload?.galleryImages)
    ? payload.galleryImages.map((image) => normalizeAssetPayload(image, "gallery")).filter(Boolean)
    : [];
  const rawLivestream = payload?.livestream || payload?.streaming || payload?.event?.livestream || {};
  const livestreamUrl = normalizeText(rawLivestream?.url || rawLivestream?.link);
  const livestreamEnabled = Boolean(payload?.features?.livestreamEnabled || rawLivestream?.enabled || livestreamUrl);
  const livestreamPlatformLabel = inferLivestreamPlatformLabel(livestreamUrl, rawLivestream?.platformLabel || rawLivestream?.label);
  const livestreamDate = normalizeText(rawLivestream?.date || akad?.date);
  const livestreamTime = normalizeText(rawLivestream?.time || buildTimeRange(akad?.startTime, akad?.endTime));
  const rawGiftBankList = Array.isArray(giftPayload.bankList)
    ? giftPayload.bankList
        .filter((item) => item?.bank || item?.account || item?.name)
        .map((item) => ({
          bank: item.bank || "",
          account: item.account || item.accountNumber || "",
          accountNumber: item.accountNumber || item.account || "",
          name: item.name || item.accountName || "",
          accountName: item.accountName || item.name || "",
          logo: normalizeAssetPayload(item.logo, "bank-logo"),
        }))
    : [];

  return {
    status,
    orderStatus: status,
    orderId: order?.orderId || null,
    invitationSlug: invitationSlug || order?.invitationSlug || theme?.slug || "",
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
    customer: payload?.customer || null,
    theme: {
      slug: theme?.slug || "",
      name: theme?.name || "",
      title: theme?.title || "",
      packageTier: packageConfig?.tier || theme?.packageTier || "",
    },
    selectedTheme: payload?.selectedTheme || {
      slug: theme?.slug || "",
      name: theme?.name || "",
      packageTier: packageConfig?.tier || theme?.packageTier || "",
    },
    selectedPackage: payload?.selectedPackage || packageConfig,
    groom: {
      fullname: groom?.fullname || `${groomName} Yulianto`,
      nickname: groom?.nickname || groomName,
      instagram: groom?.instagram || "ikatancinta.in",
      parents: groom?.parents || "Putra dari Bapak Putra & Ibu Putri",
      photo: normalizeAssetPayload(groom?.photo, "groom") || normalizeAssetPayload(groomPhoto, "groom"),
    },
    bride: {
      fullname: bride?.fullname || `${brideName} Putri`,
      nickname: bride?.nickname || brideName,
      instagram: bride?.instagram || "ikatancinta.in",
      parents: bride?.parents || "Putri dari Bapak Putra & Ibu Putri",
      photo: normalizeAssetPayload(bride?.photo, "bride") || normalizeAssetPayload(bridePhoto, "bride"),
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
    frontCoverImage: normalizeAssetPayload(payload?.frontCoverImage, "front-cover") || normalizeAssetPayload(frontCoverPhoto, "front-cover"),
    coverImage: normalizeAssetPayload(payload?.coverImage, "cover") || normalizeAssetPayload(heroPhoto, "cover"),
    openingThumbnailImage: normalizeAssetPayload(payload?.openingThumbnailImage, "opening-thumbnail"),
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
        date: livestreamDate,
        time: livestreamTime,
        platformLabel: livestreamPlatformLabel,
        url: livestreamUrl,
      },
    },
    akad: {
      date: akad?.date || "",
      startTime: akad?.startTime || "",
      endTime: akad?.endTime || "",
      time: buildTimeRange(akad?.startTime, akad?.endTime),
      venue: akad?.venue || "",
      address: akad?.address || "Simpang Lima Gumul, Kediri",
      mapsLink: akad?.mapsLink || "https://maps.google.com",
      coverImage: normalizeAssetPayload(akad?.coverImage, "akad-cover") || normalizeAssetPayload(akadCoverPhoto, "akad-cover"),
    },
    resepsi: {
      date: resepsi?.date || akad?.date || "",
      startTime: resepsi?.startTime || "",
      endTime: resepsi?.endTime || "",
      time: buildTimeRange(resepsi?.startTime, resepsi?.endTime),
      venue: resepsi?.venue || "",
      address: resepsi?.address || akad?.address || "Simpang Lima Gumul, Kediri",
      mapsLink: resepsi?.mapsLink || akad?.mapsLink || "https://maps.google.com",
      coverImage: normalizeAssetPayload(resepsi?.coverImage, "resepsi-cover") || normalizeAssetPayload(resepsiCoverPhoto, "resepsi-cover"),
    },
    copy: {
      openingGreeting: selectedTheme?.name || theme?.title || "The Wedding Of",
      openingText: "Tanpa mengurangi rasa hormat, kami mengundang Anda untuk menghadiri acara pernikahan kami.",
      quote: payload?.quote || "",
      quoteSource: payload?.quoteSource || "",
      saveTheDateBackgroundPhoto,
      wishesBackgroundPhoto,
      closingBackgroundPhoto,
      closingText: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.",
    },
    quote: payload?.quote || "",
    quoteSource: payload?.quoteSource || "",
    saveTheDateBackgroundImage:
      normalizeAssetPayload(payload?.saveTheDateBackgroundImage, "save-the-date-bg") || normalizeAssetPayload(saveTheDateBackgroundPhoto, "save-the-date-bg"),
    wishesBackgroundImage:
      normalizeAssetPayload(payload?.wishesBackgroundImage, "wishes-bg") || normalizeAssetPayload(wishesBackgroundPhoto, "wishes-bg"),
    closingBackgroundImage:
      normalizeAssetPayload(payload?.closingBackgroundImage, "closing-bg") || normalizeAssetPayload(closingBackgroundPhoto, "closing-bg"),
    lovestory: packageConfig.capabilities.loveStory
      ? (loveStories.length ? loveStories : [
          { title: "Pertama Bertemu", text: "Kami pertama kali bertemu dalam sebuah acara kampus.", date: "2019", photo: heroPhoto },
          { title: "Menjalin Asmara", text: "Hubungan kami tumbuh menjadi komitmen yang lebih serius.", date: "2021", photo: heroPhoto },
        ])
      : [],
    stories: packageConfig.capabilities.loveStory ? rawStories : [],
    gallery: galleryImages.slice(0, packageConfig.limits.galleryMax).filter(Boolean),
    galleryImages: rawGalleryImages,
    gift: {
      bankList: packageConfig.capabilities.digitalEnvelope && hasGiftData ? rawGiftBankList : [],
      shipping: packageConfig.capabilities.digitalEnvelope && hasGiftData ? giftShipping : {},
    },
    livestream: {
      enabled: livestreamEnabled,
      date: livestreamDate,
      time: livestreamTime,
      platformLabel: livestreamPlatformLabel,
      url: livestreamUrl,
    },
    features: {
      countdownEnabled: true,
      saveTheDateEnabled: true,
      digitalEnvelopeEnabled: Boolean(packageConfig.capabilities.digitalEnvelope && hasGiftData),
      rsvpEnabled: packageConfig.capabilities.rsvp,
      livestreamEnabled: livestreamEnabled,
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
