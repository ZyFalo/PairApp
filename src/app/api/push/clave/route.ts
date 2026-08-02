/** Clave pública VAPID, que el navegador necesita para suscribirse. */
export async function GET() {
  return new Response(process.env.VAPID_PUBLIC_KEY ?? "", {
    headers: { "content-type": "text/plain" },
  })
}
