import { Router } from 'express';
import { ProductController } from '../controllers/products.controller.js';

const router = Router();
const controller = new ProductController();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.createProduct);
router.put('/:id', controller.updateProduct);
router.delete('/:id', controller.deleteProduct);
router.patch('/:id/price', controller.changePrice);

export default router;