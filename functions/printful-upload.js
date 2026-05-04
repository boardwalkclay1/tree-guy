// /functions/printful-upload.js

export async function onRequestPost(context) {
  const token = context.env.PRINTFUL_TOKEN; // 🔐 Secure server-side token

  const body = await context.request.json();

  const res = await fetch("https://api.printful.com/files", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const text = await res.text();
  return new Response(text, { status: res.status });
}
