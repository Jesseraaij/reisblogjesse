export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return new Response("Geen 'code' parameter gevonden in de URL.", { status: 400 });
    }

    const clientId = "Ov23li31OlxsOnqTuE08";
    const clientSecret = "348e4ef78e4e8440a77020684dc22b48f149e2a1";

    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json",
        "user-agent": "cloudflare-pages"
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code
      })
    });

    const data = await response.json();
    const token = data.access_token;

    if (!token) {
      return new Response(`GitHub weigerde het token: ${JSON.stringify(data)}`, { status: 400 });
    }

    // Dit stuurt het token via de URL-hash direct naar de admin-pagina en sluit de popup automatisch
    const html = `
      <!doctype html>
      <html>
        <head><title>Authenticatie voltooid</title></head>
        <body>
          <p>Inloggen gelukt! Doorsturen...</p>
          <script>
            (function() {
              const content = {
                token: "${token}",
                provider: "github"
              };
              
              if (window.opener) {
                // Stuur het bericht via postMessage én geef een fallback via de hash
                window.opener.postMessage("authorization:github:success:" + JSON.stringify(content), "*");
                window.close();
              } else {
                window.location.href = "/admin/#access_token=" + encodeURIComponent(content.token) + "&provider=github";
              }
            })();
          </script>
        </body>
      </html>
    `;

    return new Response(html, {
      headers: { "content-type": "text/html;charset=UTF-8" }
    });

  } catch (err) {
    return new Response(`Worker Crash Error: ${err.message}`, { status: 500 });
  }
}