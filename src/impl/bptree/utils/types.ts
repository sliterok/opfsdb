type Primitive = string | number | null | boolean
type Json = Primitive | Primitive[] | Json[] | { [key: string]: Json }

export type { Json }
