import { supabase } from '../lib/supabase';
import { toastError } from '../utils/toastHelper';

// Upload parental consent file
export const uploadParentalConsent = async (file: File): Promise<string | null> => {
  const fileName = `parental-consent/${Date.now()}-${file.name}`;

  const { data: fileData, error: uploadError } = await supabase.storage
    .from('controle-parental')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.warn('File upload error:', uploadError);
    toastError('parentalConsentUploadError');
    throw uploadError;
  }

  const { data: urlData } = supabase.storage
    .from('controle-parental')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};