export async function onRequestGet(context) {
  const clientId = "Ov23li31OlxsOnqTuE08";
  const url = new URL(context.request.url);
  const redirectUri = `https://${url.host}/callback`;
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user`;
  
  return Response.redirect(githubAuthUrl, 302);
}