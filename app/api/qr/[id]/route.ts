import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateQrPngBuffer } from '@/lib/qrcode';

// Downloadable QR PNG for one athlete profile. Access follows the same
// rule as the profile itself (RLS: published, or the guardian viewing
// their own unpublished draft) -- there is no separate privacy surface
// here since the QR only ever encodes the public profile URL.
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: athlete } = await supabase
    .from('athlete_profiles')
    .select('slug, first_name, last_name')
    .eq('id', params.id)
    .single();

  if (!athlete) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const targetUrl = `${siteUrl}/athletes/${athlete.slug}`;
  const png = await generateQrPngBuffer(targetUrl);

  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${athlete.slug}-qr.png"`,
      'Cache-Control': 'private, max-age=0, no-cache',
    },
  });
}
