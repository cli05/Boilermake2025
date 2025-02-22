// https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow

const CLIENT_ID = "1d0be52da5a343149b498d6a51d4f6fe";
const REDIRECT_URI = "http://localhost:3000";
const SCOPE = "user-read-private user-read-email";

const VERIFIER_LEN = 128;

const AUTH_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";

const generateCodeVerifier = (len) => {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  const random = new Uint8Array(len);
  crypto.getRandomValues(random);

  let verifier = "";

  for (let i = 0; i < len; i++) {
    verifier += possible.charAt(random[i] % possible.length);
  }

  return verifier;
};

const generateCodeChallenge = async (verifier) => {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(verifier);
  
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashText = String.fromCharCode(...hashArray);

  const base64Encoded = btoa(hashText).replace(/=/g, "")
                                      .replace(/\+/g, "-")
                                      .replace(/\//g, "_");

  return base64Encoded;
};

export const loginToSpotify = async () => {
  const verifier = generateCodeVerifier(VERIFIER_LEN);
  const challenge = await generateCodeChallenge(verifier);

  window.localStorage.setItem("code_verifier", verifier);

  const params = {
    response_type: "code",
    client_id: CLIENT_ID,
    scope: SCOPE,
    code_challenge_method: "S256",
    code_challenge: challenge,
    redirect_uri: REDIRECT_URI,
  };

  const url = new URL(AUTH_URL);
  url.search = new URLSearchParams(params).toString();
  
  window.location.href = url.toString();
};

export const requestToken = async (code) => {
  const verifier = window.localStorage.getItem("code_verifier");
  window.localStorage.removeItem("code_verifier");

  if (!verifier) {
    // no verifier found
  }

  const url = TOKEN_URL;  
  const payload = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
		},
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  };

  const response = await fetch(TOKEN_URL, payload);
  const data = await response.json();

  return data;
};
