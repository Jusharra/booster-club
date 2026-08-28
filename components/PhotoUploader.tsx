'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function PhotoUploader({
  athleteId,
  currentPhotoUrl,
  defaultAlt,
  onUploaded,
}: {
  athleteId: string;
  currentPhotoUrl: string | null;
  defaultAlt: string;
  onUploaded: (url: string, alt: string) => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const ext = file.name.split('.').pop();
      const path = `${user.id}/${athleteId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('athlete-photos')
        .upload(path, file, { upsert: true, cacheControl: '3600' });

      if (uploadError) {
        alert(uploadError.message);
        return;
      }

      const { data } = supabase.storage.from('athlete-photos').getPublicUrl(path);
      setPreview(data.publicUrl);
      await onUploaded(data.publicUrl, defaultAlt);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={defaultAlt} className="mb-3 h-32 w-32 rounded-lg object-cover" />
      )}
      <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} />
      {uploading && <p className="mt-1 text-sm text-slate-500">Uploading…</p>}
    </div>
  );
}
