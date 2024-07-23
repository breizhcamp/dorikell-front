import type Pair from "@/types/Pair"

export default interface Desk {
  id: string
  name: string
  codes: Pair<number, number>
}
