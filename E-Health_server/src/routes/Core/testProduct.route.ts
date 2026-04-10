import { Router } from 'express'
import { getAllProductsController } from '../../controllers/Core/testProduct.controller'

const productRouter = Router()

productRouter.get('/testproducts', getAllProductsController)

export default productRouter
