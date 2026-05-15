export type UserPlan = 'free' | 'beta' | 'pro'

export interface AppUser {
  uid: string
  email: string
  displayName?: string
  plan: UserPlan
  createdAt: number
}

// ─── ELECTRICISTA (Perfil Técnico) ───

export interface Matricula {
  numero: string
  colegio: string
  jurisdiccion: string
}

export interface Instrumento {
  id: string
  tipo: string
  marca: string
  modelo: string
  nroSerie: string
}

export interface Electricista extends AppUser {
  cuit: string
  telefono: string
  domicilioProfesional: string
  matriculas: Matricula[]
  instrumentos: Instrumento[]
}

// ─── CLIENTE ───

export interface Cliente {
  id: string
  razonSocial: string
  dniCuit: string
  email?: string
  telefono?: string
  domicilio?: string
  proyectosIds: string[]
}
