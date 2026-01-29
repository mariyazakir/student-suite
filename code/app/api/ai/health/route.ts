export async function GET() {
  return Response.json({ online: false, message: 'Local AI disabled.' }, { status: 200 });
}
