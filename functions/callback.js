export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const code = url.searchParams.get("code");
  const clientId = "Ov23li31OpenqTuE08";
  
  // Stuur de code door naar GitHub om het inlog-token op te halen
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "accept": "json"
    },
    body: JSON.stringify({
      client_id: clientId,
      code: code
    })
  });

  const tokenData = await tokenResponse.json();
  const token = tokenData.access_token;

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