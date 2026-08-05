export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const code = url.searchParams.get("code");
  
  const clientId = "Ov23li31OlxsOnqTuE08";
  // Als je een Client Secret hebt, kun je die hier invullen (tussen de quotes), anders laten we hem leeg of vangen we het op
  const clientSecret = "JOUW_ECHTE_CLIENT_SECRET_HIER";

  if (!code) {
    return new Response("Geen autorisatiecode ontvangen van GitHub.", { status: 400 });
  }

  // Vraag het access token op bij GitHub
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "accept": "json"
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: code
    })
  });

  const tokenData = await tokenResponse.json();
  const token = tokenData.access_token;

  if (!token) {
    return new Response("Fout bij ophalen van token: " + JSON.stringify(tokenData), { 
      headers: { "content-type": "text/plain" },
      status: 400 
    });
  }

  // Stuur het token netjes terug naar het CMS venster
  const html = `
    <!doctype html>
    <html>
      <head><title>Authentication Success</title></head>
      <body>
        <script>
          const receiveMessage = (message) => {
            window.opener.postMessage(
              "authorization:github:success:${JSON.stringify({ token: token, provider: "github" })}",
              message.origin
            );
            window.removeEventListener("message", receiveMessage, false);
          };
          window.addEventListener("message", receiveMessage, false);
          window.opener.postMessage("authorizing:github", "*");
        </script>
      </body>
    </html>
  `;

  return new Response(html, {
    headers: { "content-type": "text/html;charset=UTF-8" }
  });
}