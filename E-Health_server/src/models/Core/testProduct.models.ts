export interface Product {
  id: number
  name: string
  description: string | null
  price: number
  stock: number
  created_at: Date
}
