import { supabase } from '@/integrations/supabase/client';

/**
 * Uploads a certificate file to the 'official-certificates' bucket.
 * Intended for use by Company profiles.
 *
 * @param file The File object (PDF/Image) to upload.
 * @param projectId The ID of the project the certificate is for.
 * @param teamId The ID of the team receiving the certificate.
 * @returns The storage path and any error.
 */
export async function uploadCertificate(file: File, projectId: string, teamId: string) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${projectId}/${teamId}-${Date.now()}.${fileExt}`;
    const filePath = `certificates/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('official-certificates')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Upload Error:', uploadError);
      return { path: null, error: uploadError.message };
    }

    // Now insert a tracking record in the certificates table
    const { data: session } = await supabase.auth.getSession();
    const companyId = session?.session?.user.id;

    if (!companyId) {
       return { path: null, error: 'User not authenticated as company.' };
    }

    const { data: certRecord, error: dbError } = await (supabase as any)
      .from('certificates')
      .insert({
        project_id: projectId,
        team_id: teamId,
        issued_by_company_id: companyId,
        storage_path: uploadData.path
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB Insert error:', dbError);
      return { path: uploadData.path, error: dbError.message };
    }

    return { path: uploadData.path, error: null, record: certRecord };
  } catch (err: any) {
    return { path: null, error: err.message };
  }
}

/**
 * Generates a temporally signed URL for a specific certificate for secure download.
 * Requires the user to be permitted by RLS to access the object.
 *
 * @param storagePath The exact path of the certificate in the bucket.
 * @param expiresIn Time in seconds until the link expires. (Default: 60)
 * @returns The signed URL and any error.
 */
export async function getCertificateDownloadUrl(storagePath: string, expiresIn: number = 60) {
  const { data, error } = await supabase.storage
    .from('official-certificates')
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    console.error('Error generating signed URL:', error);
    return { url: null, error: error.message };
  }

  return { url: data?.signedUrl, error: null };
}
