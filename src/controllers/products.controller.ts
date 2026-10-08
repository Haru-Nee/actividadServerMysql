import type { Request, Response } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../conf/dbConnection.js";

export interface Product extends RowDataPacket {
  id: number;
  name: string;
  price: number;
  stock: number;
  description: string;
  brand?: string | null;
  img?: string | null;
  active: boolean;
}

interface ProductBody {
  name?: string;
  price?: number | string;
  stock?: number;
  description?: string;
  brand?: string;
  img?: string;
}

export class ProductController {

  // GET /api/v1/products/getAll
  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const [rows] = await pool.query<Product[]>("SELECT * FROM products WHERE active = TRUE");
      res.status(200).json({ status: "success", data: rows });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }
  }

  // GET /api/v1/products/getById/:id
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = +req.params.id!;
      if (isNaN(id) || id <= 0 || !Number.isInteger(id)) {
        res.status(400).json({ status: "fail", message: "El ID debe ser un entero positivo" });
        return;
      }

      const [rows] = await pool.query<Product[]>(
        "SELECT * FROM products WHERE id = ? AND active = TRUE", 
        [id]
      );
      
      if (rows.length === 0) {
        res.status(404).json({ status: "fail", message: "Producto no encontrado o inactivo" });
        return;
      }

      res.status(200).json({ status: "success", data: rows[0] });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }
  }

  // POST /api/v1/products/create
  async createProduct(req: Request<{}, {}, ProductBody>, res: Response): Promise<void> {
    try {
      const { name, price, stock, description, brand, img } = req.body;
      const numericPrice = +price!;

      if (!name || stock === undefined || !description) {
        res.status(400).json({ status: "fail", message: "Faltan campos obligatorios" });
        return;
      }

      if (isNaN(numericPrice) || numericPrice <= 0) {
        res.status(400).json({ status: "fail", message: "El precio debe ser un número mayor a cero" });
        return;
      }

      const [result] = await pool.query<ResultSetHeader>(
        "INSERT INTO products (name, price, stock, description, brand, img) VALUES (?, ?, ?, ?, ?, ?)",
        [name, numericPrice, stock, description, brand || null, img || null]
      );

      res.status(201).json({ status: "success", message: "Producto creado", id: result.insertId });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }
  }

  // PUT /api/v1/products/update/:id
  async updateProduct(req: Request<{ id: string }, {}, ProductBody>, res: Response): Promise<void> {
    try {
      const id = +req.params.id!;
      if (isNaN(id) || id <= 0 || !Number.isInteger(id)) {
        res.status(400).json({ status: "fail", message: "El ID debe ser un entero positivo" });
        return;
      }

      const { name, price, stock, description, brand, img } = req.body;
      const numericPrice = +price!;

      if (isNaN(numericPrice) || numericPrice <= 0) {
        res.status(400).json({ status: "fail", message: "El precio debe ser un número mayor a cero" });
        return;
      }

      const [result] = await pool.query<ResultSetHeader>(
        "UPDATE products SET name = ?, price = ?, stock = ?, description = ?, brand = ?, img = ? WHERE id = ? AND active = TRUE",
        [name, numericPrice, stock, description, brand || null, img || null, id]
      );

      if (result.affectedRows === 0) {
        res.status(404).json({ status: "fail", message: "Producto no encontrado o inactivo" });
        return;
      }

      res.status(200).json({ status: "success", message: "Producto actualizado" });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }
  }

  // DELETE /api/v1/products/delete/:id (Baja Lógica)
  async deleteProduct(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const id = +req.params.id!;
      if (isNaN(id) || id <= 0 || !Number.isInteger(id)) {
        res.status(400).json({ status: "fail", message: "El ID debe ser un entero positivo" });
        return;
      }

      const [result] = await pool.query<ResultSetHeader>(
        "UPDATE products SET active = FALSE WHERE id = ? AND active = TRUE",
        [id]
      );

      if (result.affectedRows === 0) {
        res.status(404).json({ status: "fail", message: "Producto no encontrado o ya inactivo" });
        return;
      }

      res.status(200).json({ status: "success", message: "Producto dado de baja lógicamente" });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }
  }

  // PATCH /api/v1/products/change-price/:id
  async changePrice(req: Request<{ id: string }, {}, { price?: number | string }>, res: Response): Promise<void> {
    try {
      const id = +req.params.id!;
      if (isNaN(id) || id <= 0 || !Number.isInteger(id)) {
        res.status(400).json({ status: "fail", message: "El ID debe ser un entero positivo" });
        return;
      }

      const { price } = req.body;
      const numericPrice = +price!;

      if (isNaN(numericPrice) || numericPrice <= 0) {
        res.status(400).json({ status: "fail", message: "El precio debe ser un número mayor a cero" });
        return;
      }

      const [result] = await pool.query<ResultSetHeader>(
        "UPDATE products SET price = ? WHERE id = ? AND active = TRUE",
        [numericPrice, id]
      );

      if (result.affectedRows === 0) {
        res.status(404).json({ status: "fail", message: "Producto no encontrado o inactivo" });
        return;
      }

      res.status(200).json({ status: "success", message: "Precio actualizado" });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }
  }
}