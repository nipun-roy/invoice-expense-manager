import { BusinessProfile, IBusinessProfile } from '../models/BusinessProfile.js';
import { UpdateBusinessProfileInput } from '../validators/businessProfile.validator.js';
import { AppError } from '../utils/AppError.js';

export const getBusinessProfile = async (userId: string): Promise<IBusinessProfile> => {
  let profile = await BusinessProfile.findOne({ user: userId });
  if (!profile) {
    // If not existing for any reason, create a default profile
    profile = await BusinessProfile.create({
      user: userId,
      businessName: 'My Business',
      invoicePrefix: 'INV-',
      defaultCurrency: 'BDT',
    });
  }
  return profile;
};

export const updateBusinessProfile = async (
  userId: string,
  data: UpdateBusinessProfileInput
): Promise<IBusinessProfile> => {
  const profile = await BusinessProfile.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        businessName: data.businessName,
        logoUrl: data.logoUrl || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        taxVatNumber: data.taxVatNumber || '',
        invoicePrefix: data.invoicePrefix,
        defaultCurrency: data.defaultCurrency,
      },
    },
    { new: true, upsert: true, runValidators: true }
  );

  if (!profile) {
    throw new AppError('Failed to update business profile', 500);
  }

  return profile;
};

