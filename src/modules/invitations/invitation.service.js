import { buildInvitationSchema } from "../../utils/buildInvitationSchema.js";
import { getOrderByInvitationSlug } from "../orders/order.service.js";
import { getPackageConfig } from "../packages/package.service.js";
import { getThemeBySlug } from "../themes/theme.service.js";
import { listWishes } from "../wishes/wish.service.js";

const INITIAL_WISHES = [
  {
    author: "Tim Ikatan Cinta",
    comment: "Semoga acara berjalan lancar dan penuh kebahagiaan.",
    attendance: "hadir",
    createdAt: "2026-03-12T10:00:00.000Z",
  },
];

export async function getInvitationBySlug(slug) {
  const relatedOrder = await getOrderByInvitationSlug(slug);
  const resolvedThemeSlug = relatedOrder?.themeSlug || slug;
  const theme = getThemeBySlug(resolvedThemeSlug);
  if (!theme) return null;

  const packageConfig = getPackageConfig(relatedOrder?.packageTier || theme.packageTier);
  const storedWishes = await listWishes(slug);
  const wishes = [...storedWishes, ...INITIAL_WISHES];

  return buildInvitationSchema({
    theme,
    packageConfig,
    invitationSlug: slug,
    order: relatedOrder,
    wishes,
  });
}
