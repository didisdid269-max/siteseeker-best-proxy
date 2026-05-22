import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const { query, engine = 'duckduckgo', safe = 'off' } = await req.json();

    if (!query) {
      return Response.json({ error: 'Query is required' }, { status: 400 });
    }

    const safeParam = safe === 'on' ? '1' : '-2';
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kp=${safeParam}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      return Response.json({ error: `Search fetch failed: ${response.status}` }, { status: 502 });
    }

    const html = await response.text();
    const results = parseDDGResults(html);

    return Response.json({
      query,
      engine,
      results,
      proxied_via: 'secroxy.com',
      total: results.length,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function decodeDDGUrl(href) {
  // DDG wraps URLs as //duckduckgo.com/l/?uddg=ENCODED_URL
  // Extract the actual URL from the uddg param
  if (href.includes('uddg=')) {
    const uddg = href.match(/uddg=([^&]+)/);
    if (uddg) {
      try {
        return decodeURIComponent(uddg[1]);
      } catch {
        return null;
      }
    }
  }
  if (href.startsWith('http')) return href;
  return null;
}

function cleanText(str) {
  return str
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDDGResults(html) {
  const results = [];

  // DDG HTML has class before href: <a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=URL">
  const linkRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  const snippetRegex = /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

  const links = [];
  const snippets = [];

  let lm;
  while ((lm = linkRegex.exec(html)) !== null) {
    const rawHref = lm[1].replace(/&amp;/g, '&');
    const title = cleanText(lm[2]);
    const realUrl = decodeDDGUrl(rawHref);
    if (realUrl && title && title.length > 2) {
      links.push({ url: realUrl, title });
    }
  }

  let sm;
  while ((sm = snippetRegex.exec(html)) !== null) {
    const text = cleanText(sm[1]);
    if (text) snippets.push(text);
  }

  for (let i = 0; i < Math.min(links.length, 20); i++) {
    results.push({
      title: links[i].title.substring(0, 150),
      url: links[i].url,
      description: (snippets[i] || '').substring(0, 300),
    });
  }

  return results;
}