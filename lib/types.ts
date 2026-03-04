export interface Team {
  id: string
  name: string
  logo: string
  primaryColor: string
  secondaryColor?: string
  logoOffsetHome?: { x: number; y: number }
  logoOffsetAway?: { x: number; y: number }
  aliases?: string[]
}

export interface League {
  id: string
  name: string
  logo: string
}

export interface Fixture {
  id: string
  leagueId: string
  homeTeamId: string
  awayTeamId: string
  date?: string
}

export interface TeamWithColors extends Team {
  contrastTextColor: string
}

