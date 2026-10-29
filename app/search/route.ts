export async function GET(request: Request) {
  const url = new URL(request.url);
  return Response.redirect(new URL(`/chennai/search${url.search}`, url), 307);
}
