export interface Profile {
  id: string
  name: string
  created_at: string
}

export interface Group {
  id: string
  name: string
  invite_code: string
  created_by: string
  created_at: string
}

export interface GroupMember {
  group_id: string
  user_id: string
  joined_at: string
  profile?: Profile
}

export interface UserSticker {
  user_id: string
  group_id: string
  sticker_id: string
  quantity: number
  updated_at: string
}

export type QuantityMap = Record<string, number>
