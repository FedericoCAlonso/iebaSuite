export type UserPlan = 'free' | 'beta' | 'pro'

export interface AppUser {
  uid: string
  email: string
  displayName?: string
  plan: UserPlan
  createdAt: number
}
