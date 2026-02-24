import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
  console.error("DEBUG: Supabase URL is missing or using placeholder. This means your environment variables were NOT present during the build process.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export const uploadBase64 = async (base64Data: string, bucket: string, path: string, mimeType: string) => {
  // Remove data:image/png;base64, prefix if present
  const base64 = base64Data.includes('base64,') ? base64Data.split('base64,')[1] : base64Data;
  
  // Convert base64 to Blob
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, {
      contentType: mimeType,
      upsert: true
    });

  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrl;
};
