import { getAllProductsRepo } from '../../repository/Core/testProduct.repository'
import { Product } from '../../models/Core/testProduct.models'

export const getAllProductsService = async (): Promise<Product[]> => {
  const products = await getAllProductsRepo()


  return products
}
