import { Request, Response } from 'express'
import { getAllProductsService } from '../../services/Core/testProduct.service'

export const getAllProductsController = async (
  req: Request,
  res: Response
) => {
  try {
    const products = await getAllProductsService()

    return res.status(200).json({
      success: true,
      message: 'Get product list successfully',
      data: products
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}
