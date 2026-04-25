export interface ProjectData {
  // 1. ХТО МИ — structured fields
  companyName: string
  companyIndustry: string
  companyYear: string
  companyGeo: string
  companyTeam: string
  companyProducts: string

  // 2. ЦІЛІ
  goals: string

  // 3. ЗАДАЧІ
  tasks: string

  // 4. АНАЛІТИКА
  analytics: string
  competitorAnalysis: string

  // 5. ПОЗИЦІЮВАННЯ БРЕНДУ
  brandMission: string
  brandVision: string
  brandValues: string
  brandArchetypes: string
  brandEnemies: string
  communicationPillars: string

  // 6. УЦП
  uvp: string

  // 7. КОНТЕНТ-СТРАТЕГІЯ
  unifyingIdea: string
  toneOfVoice: string
  contentRubricator: string
  visualConcept: string

  // 8. СТРАТЕГІЯ ПРОСУВАННЯ
  paidTools: string
  organicTools: string
  salesFunnels: string

  // 9. БІО ПРОФІЛЮ ТА HIGHLIGHTS
  bioStructure: string
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
  companyName: '',
  companyIndustry: '',
  companyYear: '',
  companyGeo: '',
  companyTeam: '',
  companyProducts: '',
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
