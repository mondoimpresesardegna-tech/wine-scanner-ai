/**
 * QUESTA È LA FUNZIONE SERVERLESS (IL NOSTRO INTERMEDIARIO SICURO)
 * * COME FUNZIONA:
 * 1. L'app (wine_scanner.html) invia una richiesta a questa funzione.
 * 2. Questa funzione viene eseguita su un server (es. Netlify, Vercel), non nel browser dell'utente.
 * 3. Recupera la tua CHIAVE API SEGRETA dalle "Environment Variables" (variabili d'ambiente) del servizio di hosting.
 * 4. Aggiunge la chiave segreta alla richiesta e la inoltra a Google Gemini.
 * 5. Riceve la risposta da Google e la restituisce all'app.
 * * In questo modo, la chiave API non lascia MAI il server e rimane totalmente sicura.
 */

// Questo codice è scritto in un formato compatibile con Netlify Functions e Vercel Serverless Functions.
export default async (req, context) => {
  // Controlla che la richiesta sia di tipo POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 1. Recupera la chiave API segreta dalle variabili d'ambiente.
    // DEVI IMPOSTARE QUESTA VARIABILE NEL PANNELLO DEL TUO HOSTING (es. Netlify, Vercel).
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Se la chiave non è impostata sul server, restituisce un errore chiaro.
      return new Response(JSON.stringify({ error: 'API key not configured on the server.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Legge i dati inviati dall'app (il payload originale per Gemini).
    const body = await req.json();
    const geminiPayload = body.data;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    // 3. Inoltra la richiesta a Google Gemini con la chiave segreta.
    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiPayload),
    });

    if (!geminiResponse.ok) {
      // Se Google restituisce un errore, lo inoltra all'app.
      const errorText = await geminiResponse.text();
      console.error('Google API Error:', errorText);
      return new Response(JSON.stringify({ error: `Google API Error: ${errorText}` }), {
        status: geminiResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Inoltra la risposta di successo di Google direttamente all'app.
    const data = await geminiResponse.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Proxy Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

