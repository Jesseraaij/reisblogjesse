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

    // Dit script stuurt het token door en geeft een duidelijke knop als de browser weigert te sluiten
    const html = `
      <!doctype html>
      <html>
        <head><title>Inloggen gelukt</title></head>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
          <h2>Inloggen gelukt! 🎉</h2>
          <p>Je kunt dit venster sluiten of op de knop hieronder klikken.</p>
          <p><a href="/admin/" target="_parent" style="background: #24292e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Ga naar Dashboard</a></p>
          <script>
            const content = {
              token: "${token}",
              provider: "github"
            };
            if (window.opener) {
              window.opener.postMessage("authorization:github:success:" + JSON.stringify(content), "*");
            }
            // Probeer alsnog automatisch te sluiten
            setTimeout(() => { window.close(); }, 500);
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