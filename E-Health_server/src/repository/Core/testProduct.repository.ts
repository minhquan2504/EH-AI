import { pool } from '../../config/postgresdb'
import { Product } from '../../models/Core/testProduct.models'

export const getAllProductsRepo = async (): Promise<Product[]> => {
  const query = `
    SELECT id, name, description, price, created_at
    FROM public.product  -- Thêm "public." vào trước
    ORDER BY created_at DESC
  `

  const { rows } = await pool.query(query)
  return rows
}
