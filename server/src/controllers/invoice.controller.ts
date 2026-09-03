import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  duplicateInvoice,
  markInvoicePaid,
  getInvoiceForPdf,
} from '../services/invoice.service.js';
import { generateInvoicePdf } from '../services/pdf.service.js';
import { AppError } from '../utils/AppError.js';

export const create = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    const invoice = await createInvoice(userId, req.body);
    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

export const list = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    const result = await getInvoices(userId, req.query as any);
    res.status(200).json({
      success: true,
      data: result.invoices,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getOne = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    const invoice = await getInvoiceById(userId, req.params.id);
    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    const invoice = await updateInvoice(userId, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

export const remove = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    await deleteInvoice(userId, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Draft invoice deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const duplicate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    const duplicated = await duplicateInvoice(userId, req.params.id);
    res.status(201).json({
      success: true,
      message: 'Invoice duplicated successfully',
      data: duplicated,
    });
  } catch (error) {
    next(error);
  }
};

export const markPaid = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    const invoice = await markInvoicePaid(userId, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Invoice marked as paid',
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadPdf = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError('Unauthorized', 401));

    const pdfData = await getInvoiceForPdf(userId, req.params.id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="invoice-${pdfData.invoice.invoiceNumber}.pdf"`
    );

    generateInvoicePdf(
      pdfData,
      (chunk) => res.write(chunk),
      () => res.end()
    );
  } catch (error) {
    next(error);
  }
};

