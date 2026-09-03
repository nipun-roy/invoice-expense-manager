import { Product, IProduct } from '../models/Product.js';
import {
  CreateProductInput,
  UpdateProductInput,
  ProductQueryInput,
} from '../validators/product.validator.js';
import { AppError } from '../utils/AppError.js';
import mongoose from 'mongoose';

export const createProduct = async (
  userId: string,
  data: CreateProductInput
): Promise<IProduct> => {
  const product = await Product.create({
    user: new mongoose.Types.ObjectId(userId),
    name: data.name,
    description: data.description || '',
    price: data.price,
    unit: data.unit || 'item',
    taxRate: data.taxRate ?? 0,
    isActive: data.isActive ?? true,
  });

  return product;
};

export const getProducts = async (
  userId: string,
  query: ProductQueryInput
) => {
  const filter: Record<string, any> = { user: new mongoose.Types.ObjectId(userId) };

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  if (query.search && query.search.trim() !== '') {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    filter.$or = [{ name: searchRegex }, { description: searchRegex }];
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getProductById = async (
  userId: string,
  productId: string
): Promise<IProduct> => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new AppError('Invalid product ID', 400);
  }

  const product = await Product.findOne({
    _id: productId,
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return product;
};

export const updateProduct = async (
  userId: string,
  productId: string,
  data: UpdateProductInput
): Promise<IProduct> => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new AppError('Invalid product ID', 400);
  }

  const product = await Product.findOneAndUpdate(
    {
      _id: productId,
      user: new mongoose.Types.ObjectId(userId),
    },
    { $set: data },
    { new: true, runValidators: true }
  );

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return product;
};

export const deleteProduct = async (
  userId: string,
  productId: string
): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new AppError('Invalid product ID', 400);
  }

  const deleted = await Product.findOneAndDelete({
    _id: productId,
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!deleted) {
    throw new AppError('Product not found', 404);
  }
};

