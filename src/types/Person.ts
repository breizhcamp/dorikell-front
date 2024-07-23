import type { Dayjs } from "dayjs"
import type { PassType } from "@/types/Pass"
import type Desk from "@/types/Desk"

export default interface Person {
  id: string

  code: number
  desk: Desk
  firstname: string
  lastname: string
  company?: string
  pass: PassType
  used: boolean
  checkIn?: Dayjs
}
