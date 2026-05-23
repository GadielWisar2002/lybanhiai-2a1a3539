import streakCap from "@/assets/streak-cap.png";
import { useTranslation } from "react-i18next";

export function StreakBadge({ days }: { days: number }) {
  const { t } = useTranslation();
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/15 px-3 py-1.5">
      <img src={streakCap} alt="" width={28} height={28} className="size-7" loading="lazy" />
      <div className="flex items-baseline gap-1">
        <span className="font-display text-lg font-bold text-foreground leading-none">{days}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("common.days")}</span>
      </div>
    </div>
  );
}
