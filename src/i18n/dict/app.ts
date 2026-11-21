/* Strings for the "app" area, keyed "app.<key>". Owned by the subagent working on this area. */
export const app = {
  en: {
    "shell.pending": "Your company is waiting for admin approval. Swiping and publishing unlock once approved.",
    "shell.rejected": "Your company was not approved: {note}. Update your profile and contact Lumora.",
  } as Record<string, string>,
  ru: {
    "shell.pending": "Компания ждёт одобрения администратора. Свайпы и публикация откроются после проверки.",
    "shell.rejected": "Компания не одобрена: {note}. Обновите профиль и свяжитесь с Lumora.",
  } as Record<string, string>,
  uz: {
    "shell.pending": "Kompaniyangiz administrator tasdig'ini kutmoqda. Svayp va e'lon joylash tasdiqdan so'ng ochiladi.",
    "shell.rejected": "Kompaniya tasdiqlanmadi: {note}. Profilni yangilang va Lumora bilan bog'laning.",
  } as Record<string, string>,
};
