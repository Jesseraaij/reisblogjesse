export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const code = url.searchParams.get("code");
    
    const clientId = "Ov23li31OlxsOnqTuE08";
    const clientSecret = "348e4ef78e4e8440a77020684dc22b48f149e2a1";

    if (!code) {
      return new Response("Fout: Geen autorisatiecode ontvangen van GitHub.", { status: 400 });
    }

    // Vraag het access token op als URL-encoded formulier (dit vindt GitHub fijnste)
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "accept": "application/json",
        "user-agent": "Cloudflare-Pages-Worker"
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code
      })
    });

    const tokenText = await tokenResponse.text();
    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch (e) {
      const params = new URLSearchParams(tokenText);
      tokenData = { access_token: params.get("access_token"), error: params.get("error") };
    }

    const token = tokenData.access_token;

    if (!token) {
      return new Response("GitHub weigerde het token: " + tokenText, { 
        headers: { "content-type": "text/plain;charset=UTF-8" },
        status: 400 
      });
    }

    const html = `
      <!doctype html>
      <html>
        <head><title>Bezig met inloggen...</title></head>
        <body>
          <p>Inloggen gelukt! Venster sluiten...</p>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage("authorization:github:success:${JSON.stringify({ token: token, provider: "github" })}", "*");
                window.close();
              } else {
                localStorage.setItem("netlify-cms-user", JSON.stringify({ token: "${token}", backend: { name: "github" } }));
                window.location.href = "/admin/";
              }
            } catch (e) {
              window.location.href = "/admin/";
            }
          </script>
        </body>
      </html>
    `;

    return new Response(html, {
      headers: { "content-type": "text/html;charset=UTF-8" }
    });

  } catch (err) {
    return new Response("Interne Worker Fout: " + err.message, { 
      headers: { "content-type": "text/plain;charset=UTF-8" },
      status: 500 
    });
  }
}