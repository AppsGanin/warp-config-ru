// Единый источник правды для рекламного / спонсорского блока.
//
// По умолчанию ВЫКЛЮЧЕН. Включить можно двумя способами:
//   1. env-переменной  SPONSOR_ENABLED=1  (без пересборки логики — удобно на Vercel/Netlify);
//   2. поменять DEFAULT_ENABLED на true ниже.
//
// Текст и ссылку правьте здесь — блок подхватится и на сайте (модалка результата),
// и в Telegram-боте (подпись к файлу с конфигом).

export interface Sponsor {
  /** Короткий заголовок над предложением. */
  title: string;
  /** Текст предложения. */
  text: string;
  /** Подпись на кнопке / ссылке. */
  cta: string;
  /** Куда ведёт ссылка (партнёрская / реф-ссылка). */
  url: string;
}

const DEFAULT_ENABLED = true;

// Заглушка-плейсхолдер: пока нет рекламодателя — приглашаем разместиться.
// Замените на реальный оффер, когда подключите партнёрку.
export const SPONSOR: Sponsor = {
  title: "Реклама",
  text: "Хотите здесь рекламу? Напишите — место свободно.",
  cta: "Связаться ↗",
  url: "https://t.me/duelist",
};

/**
 * Включён ли спонсорский блок.
 * env SPONSOR_ENABLED имеет приоритет; "1" / "true" → вкл, "0" / "false" → выкл.
 */
export function isSponsorEnabled(): boolean {
  const env = process.env.SPONSOR_ENABLED;
  if (env === "1" || env === "true") return true;
  if (env === "0" || env === "false") return false;
  return DEFAULT_ENABLED;
}
