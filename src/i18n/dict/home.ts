/* Strings for the "home" area, keyed "home.<key>": the Lumora home page (#/), the site navigation
   shared by the home page, Lumora Connect and the public pages.

   Source of each text:
   [site]  wording of the previous Lumora site (ivyonaire.com/lumora), in all three of its languages
   [site*] English from the previous site; Russian and Uzbek translated here, the site has no translation
   [new]   written for this site in all three languages, no source on the previous site
   Uzbek apostrophes follow this project's dictionaries (o', g'), not the curly ones of the previous site. */
export const home = {
  en: {
    // [new] navigation
    "nav.lumora": "Lumora",
    "nav.about": "About",
    "nav.hackathons": "Hackathons",
    "nav.connect": "Connect",
    "nav.contact": "Contacts",
    "tabs.label": "Site sections",
    "tabs.jobs": "Jobs",

    // [site] hero
    "hero.title": "One-day IT hackathons in every region of Uzbekistan.",
    "hero.steps": "Build a team. Make an MVP. Demonstrate it.",
    "hero.register": "Register",
    "hero.photo": "Photo {n} of {total}",
    "hero.photos": "Photos from Lumora rounds",
    "region.karakalpakstan": "Karakalpakstan",
    "region.khorezm": "Khorezm",
    "region.navoiy": "Navoiy",
    "region.bukhara": "Bukhara",
    "region.samarkand": "Samarkand",
    "region.kashkadarya": "Kashkadarya",
    "region.surkhandarya": "Surkhandarya",
    "region.jizzakh": "Jizzakh",
    "region.syrdarya": "Syrdarya",
    "region.tashkentRegion": "Tashkent region",
    "region.tashkent": "Tashkent",
    "region.namangan": "Namangan",
    "region.andijan": "Andijan",
    "region.fergana": "Fergana",
    "hero.kicker": "Uzbekistan's national IT case competition",
    "hero.text": "Build a team. Take on a company challenge. Present a working solution to the people who understand the problem.",
    "hero.join": "Join the next competition", // [site]
    "hero.joinSub": "Dates, cities and registration", // [new]
    "hero.connect": "Lumora Connect", // [new]
    "hero.connectSub": "Internships and jobs for participants", // [new]

    // about
    "about.title": "Built to turn student skill into real work.", // [site]
    "about.lead": "Many students learn technology without a serious place to apply it.", // [site]
    "about.whyTitle": "Why Lumora exists", // [site]
    "about.why": "Technology education becomes meaningful when students can use it.", // [site]
    "about.whyMore": "Lumora connects ambitious students with problems from the technology industry.", // [site*]
    "about.teamTitle": "Organized by students.", // [site]
    "about.teamText": "Built across teams.", // [site]
    "about.citiesTitle": "Where Lumora runs", // [new]
    "about.regions": "{n} regions connected through one competition.", // [site*]
    "about.role.ceo": "Chief Executive Officer", // [site]
    "about.role.coo": "Chief Operating Officer",
    "about.role.cfo": "Chief Financial Officer",
    "about.role.cto": "Chief Technology Officer",

    // format
    "format.title": "How a case competition works", // [new]
    "format.lead": "A team takes a real company case, builds a working solution and defends it in front of the jury.", // [new], built from the site's hero line
    "format.register.label": "Start", // [site]
    "format.register": "Register your team",
    "format.case.label": "Understand",
    "format.case": "Receive the case",
    "format.prototype.label": "Build",
    "format.prototype": "Create the prototype",
    "format.pitch.label": "Defend",
    "format.pitch": "Pitch to the jury",
    "format.deliverTitle": "What a team brings to the jury", // [new]
    "format.d.prototype": "A working prototype", // [site]
    "format.d.story": "A clear product story",
    "format.d.pitch": "A confident live pitch",
    "format.team": "Team size is confirmed for each tournament.", // [site*]
    "format.cases": "real company cases", // [site]

    // faq [site]
    "faq.title": "Questions",
    "faq.lead": "About taking part in Lumora rounds.", // [new]
    "faq.who.q": "Who can take part?",
    "faq.who.a": "Lumora is designed for students in Uzbekistan. Each announcement confirms the eligible ages, institutions, regions and skills.",
    "faq.experience.q": "Do I need previous competition experience?",
    "faq.experience.a": "No. Bring a skill you can contribute to a team and be ready to learn quickly. The brief states any technical requirements.",
    "faq.team.q": "How large can a team be?",
    "faq.team.a": "Team size is confirmed for each tournament. Check the current announcement.",
    "faq.dates.q": "What are the dates and prizes?",
    "faq.dates.a": "They depend on the specific tournament and its partners. Lumora publishes confirmed information through its official channels.",

    // contact [site]
    "contact.title": "Contact Lumora",
    "contact.lead": "Choose the conversation you want to start.",
    "contact.note": "Questions are welcome before you apply.",
    "contact.channels": "Announcements go out on Telegram, Instagram and LinkedIn.", // [site*]
    "contact.students": "Students",
    "contact.students.title": "Join a competition",
    "contact.students.cta": "Choose your route",
    "contact.companies": "Companies",
    "contact.companies.title": "Bring a case or partnership",
    "contact.companies.cta": "Contact partnerships",
    "contact.organizers": "Organizers",
    "contact.organizers.title": "Join the Lumora team",
    "contact.organizers.cta": "Message Lumora",

    // [new] Lumora Connect teaser
    "connect.title": "Lumora Connect",
    "connect.text": "The talent network of Lumora: participants find internships and first jobs, companies find students who already shipped.",
    "connect.cta": "Open Lumora Connect",

    // [new] footer
    // pages
    "more": "Learn more", // [new]
    "about.kicker": "About Lumora", // [new]
    "about.teamLine": "The team that finds the cases and the halls, runs every round on the day, and records it for the channel.", // [site]
    "about.core": "Core team", // [site]
    "about.coreLine": "Strategy, partnerships, and communications.", // [site]
    "hackathons.kicker": "Lumora hackathons", // [new]
    "hackathons.title": "IT case competitions across Uzbekistan", // [new]
    "contacts.kicker": "Contacts", // [new]
    "contacts.firstTitle": "Keep the first message useful.", // [site]
    "contacts.firstText": "Include who you are, your city or organization, and what you want to discuss. For tournament questions, name the competition announcement you are referring to.", // [site]
    "contacts.first1": "Your name and role", // [site]
    "contacts.first2": "Your city or organization",
    "contacts.first3": "The reason for contacting Lumora",

    // [new] city names
    "city.Tashkent": "Tashkent",
    "city.Fergana": "Fergana",
    "city.Samarkand": "Samarkand",
    "city.Namangan": "Namangan",
    "city.Jizzakh": "Jizzakh",
    "city.Nukus": "Nukus",
    "city.Qarshi": "Qarshi",
    "footer.lumora": "Lumora",
  },

  ru: {
    "nav.lumora": "Lumora",
    "nav.about": "О нас",
    "nav.hackathons": "Хакатоны",
    "nav.connect": "Connect",
    "nav.contact": "Контакты",
    "tabs.label": "Разделы сайта",
    "tabs.jobs": "Вакансии",

    "hero.title": "Однодневные IT-хакатоны во всех регионах Узбекистана.",
    "hero.steps": "Собери команду. Сделай MVP. Покажи его жюри.",
    "hero.register": "Регистрация",
    "hero.photo": "Фото {n} из {total}",
    "hero.photos": "Фото с раундов Lumora",
    "region.karakalpakstan": "Каракалпакстан",
    "region.khorezm": "Хорезм",
    "region.navoiy": "Навои",
    "region.bukhara": "Бухара",
    "region.samarkand": "Самарканд",
    "region.kashkadarya": "Кашкадарья",
    "region.surkhandarya": "Сурхандарья",
    "region.jizzakh": "Джизак",
    "region.syrdarya": "Сырдарья",
    "region.tashkentRegion": "Ташкентская область",
    "region.tashkent": "Ташкент",
    "region.namangan": "Наманган",
    "region.andijan": "Андижан",
    "region.fergana": "Фергана",
    "hero.kicker": "Национальный IT кейс-чемпионат Узбекистана",
    "hero.text": "Соберите команду. Возьмите кейс компании. Представьте работающее решение тем, кто понимает проблему.",
    "hero.join": "Участвовать в соревновании",
    "hero.joinSub": "Даты, города и регистрация",
    "hero.connect": "Lumora Connect",
    "hero.connectSub": "Стажировки и работа для участников",

    "about.title": "Чтобы навыки студентов превращались в настоящую работу.",
    "about.lead": "Многие студенты изучают технологии, но им негде применить их всерьёз.",
    "about.whyTitle": "Зачем существует Lumora",
    "about.why": "Технологическое образование обретает смысл, когда студент может его применить.",
    "about.whyMore": "Lumora связывает целеустремлённых студентов с задачами из технологической индустрии.",
    "about.teamTitle": "Организуют студенты.",
    "about.teamText": "Строят команды вместе.",
    "about.citiesTitle": "Где проходит Lumora",
    "about.regions": "{n} регионов в одном соревновании.",
    "about.role.ceo": "Генеральный директор (CEO)",
    "about.role.coo": "Операционный директор (COO)",
    "about.role.cfo": "Финансовый директор (CFO)",
    "about.role.cto": "Технический директор (CTO)",

    "format.title": "Как проходит кейс-чемпионат",
    "format.lead": "Команда берёт настоящий кейс компании, делает работающее решение и защищает его перед жюри.",
    "format.register.label": "Старт",
    "format.register": "Зарегистрируйте команду",
    "format.case.label": "Понимание",
    "format.case": "Получите кейс",
    "format.prototype.label": "Создание",
    "format.prototype": "Сделайте прототип",
    "format.pitch.label": "Защита",
    "format.pitch": "Питч перед жюри",
    "format.deliverTitle": "Что команда показывает жюри",
    "format.d.prototype": "Работающий прототип",
    "format.d.story": "Понятная история продукта",
    "format.d.pitch": "Уверенный живой питч",
    "format.team": "Размер команды объявляется для каждого турнира.",
    "format.cases": "реальные кейсы компаний",

    "faq.title": "Вопросы и ответы",
    "faq.lead": "Об участии в раундах Lumora.",
    "faq.who.q": "Кто может участвовать?",
    "faq.who.a": "Lumora создана для студентов Узбекистана. В каждом анонсе указаны возраст, учебные заведения, регионы и навыки участников.",
    "faq.experience.q": "Нужен ли опыт участия в соревнованиях?",
    "faq.experience.a": "Нет. Приходите с навыком, полезным команде, и будьте готовы быстро учиться. Технические требования указаны в брифе.",
    "faq.team.q": "Сколько человек может быть в команде?",
    "faq.team.a": "Размер команды объявляется для каждого турнира. Смотрите текущий анонс.",
    "faq.dates.q": "Какие даты и призы?",
    "faq.dates.a": "Они зависят от конкретного турнира и партнёров. Lumora публикует подтверждённую информацию в официальных каналах.",

    "contact.title": "Связаться с Lumora",
    "contact.lead": "Какой разговор вы хотите начать?",
    "contact.note": "Вопросы можно задать до подачи заявки.",
    "contact.channels": "Анонсы выходят в Telegram, Instagram и LinkedIn.",
    "contact.students": "Студентам",
    "contact.students.title": "Участвовать в соревновании",
    "contact.students.cta": "Выбрать свой путь",
    "contact.companies": "Компаниям",
    "contact.companies.title": "Кейс или партнёрство",
    "contact.companies.cta": "Написать о партнёрстве",
    "contact.organizers": "Организаторам",
    "contact.organizers.title": "Присоединиться к команде Lumora",
    "contact.organizers.cta": "Написать Lumora",

    "connect.title": "Lumora Connect",
    "connect.text": "Сеть талантов Lumora: участники находят стажировки и первую работу, компании находят студентов, которые уже сделали продукт.",
    "connect.cta": "Открыть Lumora Connect",

    "more": "Подробнее",
    "about.kicker": "О Lumora",
    "about.teamLine": "Команда, которая находит кейсы и площадки, проводит каждый этап на месте и снимает его для канала.",
    "about.core": "Основная команда",
    "about.coreLine": "Стратегия, партнёрства и коммуникации.",
    "hackathons.kicker": "Хакатоны Lumora",
    "hackathons.title": "IT кейс-чемпионаты по всему Узбекистану",
    "contacts.kicker": "Контакты",
    "contacts.firstTitle": "Пусть первое сообщение будет полезным.",
    "contacts.firstText": "Напишите, кто вы, ваш город или организацию и что хотите обсудить. Если вопрос о турнире, укажите, о каком анонсе речь.",
    "contacts.first1": "Ваше имя и роль",
    "contacts.first2": "Ваш город или организация",
    "contacts.first3": "Причина обращения в Lumora",

    // [new] city names
    "city.Tashkent": "Ташкент",
    "city.Fergana": "Фергана",
    "city.Samarkand": "Самарканд",
    "city.Namangan": "Наманган",
    "city.Jizzakh": "Джизак",
    "city.Nukus": "Нукус",
    "city.Qarshi": "Карши",
    "footer.lumora": "Lumora",
  },

  uz: {
    "nav.lumora": "Lumora",
    "nav.about": "Biz haqimizda",
    "nav.hackathons": "Xakatonlar",
    "nav.connect": "Connect",
    "nav.contact": "Aloqa",
    "tabs.label": "Sayt bo'limlari",
    "tabs.jobs": "Ishlar",

    "hero.title": "O'zbekistonning barcha hududlarida bir kunlik IT xakatonlar.",
    "hero.steps": "Jamoa tuzing. MVP yarating. Hakamlarga namoyish qiling.",
    "hero.register": "Ro'yxatdan o'tish",
    "hero.photo": "{total} ta rasmdan {n}-si",
    "hero.photos": "Lumora bosqichlaridan rasmlar",
    "region.karakalpakstan": "Qoraqalpog'iston",
    "region.khorezm": "Xorazm",
    "region.navoiy": "Navoiy",
    "region.bukhara": "Buxoro",
    "region.samarkand": "Samarqand",
    "region.kashkadarya": "Qashqadaryo",
    "region.surkhandarya": "Surxondaryo",
    "region.jizzakh": "Jizzax",
    "region.syrdarya": "Sirdaryo",
    "region.tashkentRegion": "Toshkent viloyati",
    "region.tashkent": "Toshkent",
    "region.namangan": "Namangan",
    "region.andijan": "Andijon",
    "region.fergana": "Farg'ona",
    "hero.kicker": "O'zbekistonning milliy IT keys musobaqasi",
    "hero.text": "Jamoa tuzing. Kompaniya keysini oling. Ishlaydigan yechimni muammoni tushunadigan odamlarga taqdim eting.",
    "hero.join": "Musobaqaga qo'shilish",
    "hero.joinSub": "Sanalar, shaharlar va ro'yxatdan o'tish",
    "hero.connect": "Lumora Connect",
    "hero.connectSub": "Ishtirokchilar uchun amaliyot va ish",

    "about.title": "Talaba mahoratini haqiqiy ishga aylantirish uchun.",
    "about.lead": "Ko'p talabalar texnologiyani o'rganadi, lekin uni jiddiy qo'llaydigan joyi yo'q.",
    "about.whyTitle": "Lumora nega bor",
    "about.why": "Texnologik ta'lim talaba uni qo'llay olganda ma'noga ega bo'ladi.",
    "about.whyMore": "Lumora intiluvchan talabalarni texnologiya sohasidagi muammolar bilan bog'laydi.",
    "about.teamTitle": "Talabalar tashkil qiladi.",
    "about.teamText": "Jamoalar birgalikda quradi.",
    "about.citiesTitle": "Lumora qayerda o'tadi",
    "about.regions": "Bitta musobaqada {n} ta hudud.",
    "about.role.ceo": "Bosh ijrochi direktor (CEO)",
    "about.role.coo": "Operatsion direktor (COO)",
    "about.role.cfo": "Moliya direktori (CFO)",
    "about.role.cto": "Texnologiya direktori (CTO)",

    "format.title": "Keys musobaqasi qanday o'tadi",
    "format.lead": "Jamoa haqiqiy kompaniya keysini oladi, ishlaydigan yechim yaratadi va uni hakamlar oldida himoya qiladi.",
    "format.register.label": "Boshlash",
    "format.register": "Jamoani ro'yxatdan o'tkazing",
    "format.case.label": "Tushunish",
    "format.case": "Keysni oling",
    "format.prototype.label": "Qurish",
    "format.prototype": "Prototip yarating",
    "format.pitch.label": "Himoya",
    "format.pitch": "Hakamlarga taqdimot",
    "format.deliverTitle": "Jamoa hakamlarga nimani ko'rsatadi",
    "format.d.prototype": "Ishlaydigan prototip",
    "format.d.story": "Mahsulotning aniq hikoyasi",
    "format.d.pitch": "Ishonchli jonli taqdimot",
    "format.team": "Jamoa hajmi har bir turnir uchun e'lon qilinadi.",
    "format.cases": "haqiqiy kompaniya keyslari",

    "faq.title": "Savol va javoblar",
    "faq.lead": "Lumora bosqichlarida qatnashish haqida.",
    "faq.who.q": "Kim qatnasha oladi?",
    "faq.who.a": "Lumora O'zbekiston talabalari uchun yaratilgan. Har bir e'londa yosh, ta'lim muassasasi, hudud va ko'nikmalar ko'rsatiladi.",
    "faq.experience.q": "Oldin musobaqada qatnashgan bo'lishim kerakmi?",
    "faq.experience.a": "Yo'q. Jamoaga foydali ko'nikma bilan keling va tez o'rganishga tayyor bo'ling. Texnik talablar brifda ko'rsatiladi.",
    "faq.team.q": "Jamoa necha kishidan iborat bo'ladi?",
    "faq.team.a": "Jamoa hajmi har bir turnir uchun e'lon qilinadi. Joriy e'lonni ko'ring.",
    "faq.dates.q": "Sanalar va sovrinlar qanday?",
    "faq.dates.a": "Ular turnir va hamkorlarga bog'liq. Lumora tasdiqlangan ma'lumotni rasmiy kanallarida e'lon qiladi.",

    "contact.title": "Lumora bilan aloqa",
    "contact.lead": "Qaysi suhbatni boshlamoqchisiz?",
    "contact.note": "Ariza topshirishdan oldin savol berishingiz mumkin.",
    "contact.channels": "E'lonlar Telegram, Instagram va LinkedIn'da chiqadi.",
    "contact.students": "Talabalar",
    "contact.students.title": "Musobaqaga qo'shilish",
    "contact.students.cta": "Yo'lingizni tanlang",
    "contact.companies": "Kompaniyalar",
    "contact.companies.title": "Keys yoki hamkorlik olib keling",
    "contact.companies.cta": "Hamkorlik jamoasiga yozish",
    "contact.organizers": "Tashkilotchilar",
    "contact.organizers.title": "Lumora jamoasiga qo'shiling",
    "contact.organizers.cta": "Lumora'ga yozish",

    "connect.title": "Lumora Connect",
    "connect.text": "Lumora iqtidorlar tarmog'i: ishtirokchilar amaliyot va birinchi ishni topadi, kompaniyalar mahsulot yaratgan talabalarni topadi.",
    "connect.cta": "Lumora Connect'ni ochish",

    "more": "Batafsil",
    "about.kicker": "Lumora haqida",
    "about.teamLine": "Keys va zallarni topadigan, har bir bosqichni joyida o'tkazadigan va kanal uchun yozib oladigan jamoa.",
    "about.core": "Asosiy jamoa",
    "about.coreLine": "Strategiya, hamkorlik va kommunikatsiya.",
    "hackathons.kicker": "Lumora xakatonlari",
    "hackathons.title": "O'zbekiston bo'ylab IT keys musobaqalari",
    "contacts.kicker": "Aloqa",
    "contacts.firstTitle": "Birinchi xabaringiz foydali bo'lsin.",
    "contacts.firstText": "Kim ekaningiz, shahringiz yoki tashkilotingiz va nimani muhokama qilmoqchi ekaningizni yozing. Turnir haqidagi savolda qaysi e'lonni nazarda tutayotganingizni ayting.",
    "contacts.first1": "Ismingiz va rolingiz",
    "contacts.first2": "Shahringiz yoki tashkilotingiz",
    "contacts.first3": "Lumora'ga yozish sababi",

    // [new] city names
    "city.Tashkent": "Toshkent",
    "city.Fergana": "Farg'ona",
    "city.Samarkand": "Samarqand",
    "city.Namangan": "Namangan",
    "city.Jizzakh": "Jizzax",
    "city.Nukus": "Nukus",
    "city.Qarshi": "Qarshi",
    "footer.lumora": "Lumora",
  },
};
