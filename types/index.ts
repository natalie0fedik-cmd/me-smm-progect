export interface ProjectData {
  // 1. ХТО МИ
  whoWeAre: string

  // 2. ЦІЛІ
  goals: string

  // 3. ЗАДАЧІ
  tasks: string

  // 4. АНАЛІТИКА
  analytics: string
  // 4.1 Аналіз конкурентів
  competitorAnalysis: string

  // 5. ПОЗИЦІЮВАННЯ БРЕНДУ
  // 5.1 Місія
  brandMission: string
  // 5.2 Візія
  brandVision: string
  // 5.3 Цінності бренду
  brandValues: string
  // 5.4 Архетипи бренду
  brandArchetypes: string
  // 5.5 Вороги бренду
  brandEnemies: string
  // 5.6 Кити комунікації
  communicationPillars: string

  // 6. УЦП
  uvp: string

  // 7. КОНТЕНТ-СТРАТЕГІЯ
  // 7.1 Обʼєднуюча ідея
  unifyingIdea: string
  // 7.2 Tone of Voice
  toneOfVoice: string
  // 7.3 Рубрикатор контенту
  contentRubricator: string
  // 7.4 Візуальна концепція
  visualConcept: string

  // 8. СТРАТЕГІЯ ПРОСУВАННЯ
  // 8.1 Платні інструменти
  paidTools: string
  // 8.2 Органічні інструменти
  organicTools: string
  // 8.3 Воронки продажів
  salesFunnels: string

  // 9. БІО ПРОФІЛЮ ТА HIGHLIGHTS
  // 9.1 Структура БІО
  bioStructure: string
  // 9.2 Highlights
  highlights: string

  // 10. КРІ ТА МЕТРИКИ
  kpi: string

  // 11. ЕТАПИ РЕАЛІЗАЦІЇ
  implementationStages: string
}

export interface Project {
  id: string
  name: string
  emoji: string
  description: string
  createdAt: string
  updatedAt: string
  data: ProjectData
}

export const EMPTY_PROJECT_DATA: ProjectData = {
  whoWeAre: '',
  goals: '',
  tasks: '',
  analytics: '',
  competitorAnalysis: '',
  brandMission: '',
  brandVision: '',
  brandValues: '',
  brandArchetypes: '',
  brandEnemies: '',
  communicationPillars: '',
  uvp: '',
  unifyingIdea: '',
  toneOfVoice: '',
  contentRubricator: '',
  visualConcept: '',
  paidTools: '',
  organicTools: '',
  salesFunnels: '',
  bioStructure: '',
  highlights: '',
  kpi: '',
  implementationStages: '',
}

export interface SectionDef {
  id: keyof ProjectData
  label: string
  description: string
  parent?: string
  isSubsection?: boolean
  placeholder: string
}

export const SECTIONS: SectionDef[] = [
  {
    id: 'whoWeAre',
    label: '1. ХТО МИ',
    description: 'Опис компанії, сфера діяльності, продукти / послуги, ключові факти',
    placeholder: 'Ми — [назва компанії], займаємось [сфера]. Наша аудиторія — [опис]. Ключові продукти/послуги: ...',
  },
  {
    id: 'goals',
    label: '2. ЦІЛІ',
    description: 'Стратегічні та тактичні цілі на визначений період',
    placeholder: 'Ціль 1: збільшити охоплення на X%\nЦіль 2: залучити N нових підписників\nЦіль 3: ...',
  },
  {
    id: 'tasks',
    label: '3. ЗАДАЧІ',
    description: 'Конкретні задачі для досягнення цілей',
    placeholder: '— Задача 1\n— Задача 2\n— Задача 3',
  },
  {
    id: 'analytics',
    label: '4. АНАЛІТИКА',
    description: 'Поточний стан акаунтів, ключові показники, точка старту',
    placeholder: 'Підписників: ...\nОхоплення: ...\nER: ...\nТоп-контент: ...',
  },
  {
    id: 'competitorAnalysis',
    label: '4.1 Аналіз конкурентів',
    description: 'Огляд конкурентів: сильні/слабкі сторони, контент, аудиторія',
    placeholder: 'Конкурент 1: [назва]\n— Акаунт: ...\n— Сильні сторони: ...\n— Слабкі сторони: ...\n\nКонкурент 2: ...',
    isSubsection: true,
    parent: 'analytics',
  },
  {
    id: 'brandMission',
    label: '5.1 Місія',
    description: 'Навіщо існує бренд, яку проблему вирішує',
    placeholder: 'Наша місія — ...',
    isSubsection: true,
    parent: 'brandPositioning',
  },
  {
    id: 'brandVision',
    label: '5.2 Візія',
    description: 'Яким хоче стати бренд через 3–5 років',
    placeholder: 'Наша візія — стати ...',
    isSubsection: true,
    parent: 'brandPositioning',
  },
  {
    id: 'brandValues',
    label: '5.3 Цінності бренду',
    description: 'Ключові принципи та цінності, якими керується бренд',
    placeholder: '1. Цінність — опис\n2. Цінність — опис\n3. Цінність — опис',
    isSubsection: true,
    parent: 'brandPositioning',
  },
  {
    id: 'brandArchetypes',
    label: '5.4 Архетипи бренду',
    description: 'Архетип(и) бренду за Юнгом та їх прояв у комунікації',
    placeholder: 'Основний архетип: [назва]\nОпис: ...\nЯк проявляється: ...',
    isSubsection: true,
    parent: 'brandPositioning',
  },
  {
    id: 'brandEnemies',
    label: '5.5 Вороги бренду',
    description: 'Що бренд відкидає, чому протистоїть, від чого дистанціюється',
    placeholder: 'Бренд виступає проти:\n— ...\n— ...',
    isSubsection: true,
    parent: 'brandPositioning',
  },
  {
    id: 'communicationPillars',
    label: '5.6 Кити комунікації',
    description: 'Ключові теми та напрямки, навколо яких будується комунікація',
    placeholder: 'Кит 1: [назва] — опис\nКит 2: [назва] — опис\nКит 3: [назва] — опис',
    isSubsection: true,
    parent: 'brandPositioning',
  },
  {
    id: 'uvp',
    label: '6. УЦП',
    description: 'Унікальна ціннісна пропозиція — що відрізняє бренд від конкурентів',
    placeholder: 'Ми допомагаємо [цільова аудиторія] досягти [результат] завдяки [унікальний підхід/перевага].',
  },
  {
    id: 'unifyingIdea',
    label: '7.1 Обʼєднуюча ідея',
    description: 'Головна ідея, що проходить через весь контент і обʼєднує аудиторію',
    placeholder: 'Наша обʼєднуюча ідея: ...',
    isSubsection: true,
    parent: 'contentStrategy',
  },
  {
    id: 'toneOfVoice',
    label: '7.2 Tone of Voice',
    description: 'Голос і тон бренду: як говоримо, що уникаємо, приклади',
    placeholder: 'Ми: [прикметники]\nМи НЕ: [що уникаємо]\n\nПриклади:\n— Так: "..."\n— Не так: "..."',
    isSubsection: true,
    parent: 'contentStrategy',
  },
  {
    id: 'contentRubricator',
    label: '7.3 Рубрикатор контенту',
    description: 'Категорії контенту, їх частота та мета',
    placeholder: '📌 Рубрика 1 — [назва]\nМета: ...\nЧастота: ...\nФормат: ...\n\n📌 Рубрика 2 — ...',
    isSubsection: true,
    parent: 'contentStrategy',
  },
  {
    id: 'visualConcept',
    label: '7.4 Візуальна концепція',
    description: 'Колірна палітра, шрифти, стиль фото, настрій та референси',
    placeholder: 'Колірна палітра: ...\nШрифти: ...\nСтиль фото: ...\nНастрій: ...\nРеференси: ...',
    isSubsection: true,
    parent: 'contentStrategy',
  },
  {
    id: 'paidTools',
    label: '8.1 Платні інструменти',
    description: 'Таргетована реклама, інфлюенсер-маркетинг, платні розміщення',
    placeholder: '— Facebook/Instagram Ads: ...\n— Google Ads: ...\n— Інфлюенсери: ...\n— Бюджет: ...',
    isSubsection: true,
    parent: 'promotionStrategy',
  },
  {
    id: 'organicTools',
    label: '8.2 Органічні інструменти',
    description: 'SEO, колаборації, UGC, хештеги, взаємодія з аудиторією',
    placeholder: '— Хештег-стратегія: ...\n— Колаборації: ...\n— UGC: ...\n— Активність у коментарях: ...',
    isSubsection: true,
    parent: 'promotionStrategy',
  },
  {
    id: 'salesFunnels',
    label: '8.3 Воронки продажів',
    description: 'Шлях клієнта від першого дотику до конверсії',
    placeholder: 'Воронка 1:\nУсвідомлення → Інтерес → Бажання → Дія\n1. ...\n2. ...\n3. ...',
    isSubsection: true,
    parent: 'promotionStrategy',
  },
  {
    id: 'bioStructure',
    label: '9.1 Структура БІО',
    description: 'Текст біо для профілю: хто, для кого, що, заклик до дії',
    placeholder: 'Рядок 1: [хто ми / що робимо]\nРядок 2: [для кого]\nРядок 3: [результат / перевага]\nРядок 4: [CTA + посилання]',
    isSubsection: true,
    parent: 'profileBio',
  },
  {
    id: 'highlights',
    label: '9.2 Highlights',
    description: 'Актуальні сторіс: назви, порядок, зміст кожного хайлайту',
    placeholder: '📁 Хайлайт 1 — [назва]\nЗміст: ...\n\n📁 Хайлайт 2 — [назва]\nЗміст: ...',
    isSubsection: true,
    parent: 'profileBio',
  },
  {
    id: 'kpi',
    label: '10. КРІ ТА МЕТРИКИ',
    description: 'Ключові показники ефективності та як їх вимірювати',
    placeholder: 'Охоплення: ... на місяць\nER: ...%\nПідписники: +... на місяць\nКліки: ...\nКонверсії: ...',
  },
  {
    id: 'implementationStages',
    label: '11. ЕТАПИ РЕАЛІЗАЦІЇ',
    description: 'Покроковий план впровадження стратегії з дедлайнами',
    placeholder: '🟢 Етап 1 — [назва] (дедлайн: ...)\n— Задача\n— Задача\n\n🟡 Етап 2 — ...',
  },
]

export const SECTION_GROUPS = [
  { id: 'whoWeAre', label: '1. ХТО МИ', sections: ['whoWeAre'] },
  { id: 'goals', label: '2. ЦІЛІ', sections: ['goals'] },
  { id: 'tasks', label: '3. ЗАДАЧІ', sections: ['tasks'] },
  { id: 'analytics', label: '4. АНАЛІТИКА', sections: ['analytics', 'competitorAnalysis'] },
  {
    id: 'brandPositioning',
    label: '5. ПОЗИЦІЮВАННЯ',
    sections: ['brandMission', 'brandVision', 'brandValues', 'brandArchetypes', 'brandEnemies', 'communicationPillars'],
  },
  { id: 'uvp', label: '6. УЦП', sections: ['uvp'] },
  {
    id: 'contentStrategy',
    label: '7. КОНТЕНТ-СТРАТЕГІЯ',
    sections: ['unifyingIdea', 'toneOfVoice', 'contentRubricator', 'visualConcept'],
  },
  {
    id: 'promotionStrategy',
    label: '8. ПРОСУВАННЯ',
    sections: ['paidTools', 'organicTools', 'salesFunnels'],
  },
  { id: 'profileBio', label: '9. БІО ТА HIGHLIGHTS', sections: ['bioStructure', 'highlights'] },
  { id: 'kpi', label: '10. КРІ', sections: ['kpi'] },
  { id: 'implementationStages', label: '11. ЕТАПИ', sections: ['implementationStages'] },
]
