export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const code = url.searchParams.get("code");
    
    const clientId = "Ov23li31OlxsOnqTuE08";
    const clientSecret = "JOUW_ECHTE_GEHEIME_CLIENT_SECRET_HIER";

    if (!code) {
      return new Response("Fout: Geen autorisatiecode ontvangen van GitHub.", { status: 400 });
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

    const tokenText = await tokenResponse.text();
    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch (e) {
      // Als GitHub URL-encoded terugkomt in plaats van JSON
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

  } catch (err) {
    return new Response("Interne Worker Fout: " + err.message, { 
      headers: { "content-type": "text/plain;charset=UTF-8" },
      status: 500 
    });
  }
}