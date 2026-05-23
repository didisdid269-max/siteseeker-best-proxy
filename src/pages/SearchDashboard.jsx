import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, Shield, Globe, ExternalLink, Loader2, AlertCircle } from "lucide-react";

const ENGINES = [
  { value: "bing", label: "Microsoft Bing" },
  { value: "duckduckgo", label: "DuckDuckGo" },
  { value: "google", label: "Google" },
  { value: "yahoo", label: "Yahoo" },
  { value: "yandex", label: "Yandex" },
  { value: "startpage", label: "Startpage" },
];

export default function SearchDashboard() {
  const [query, setQuery] = useState("");
  const [engine, setEngine] = useState("bing");
  const [safeSearch, setSafeSearch] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [meta, setMeta] = useState(null);
  const [openUrl, setOpenUrl] = useState(null);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setSearched(false);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          engine,
          safe: safeSearch ? "on" : "off",
        }),
      });
      const data = await res.json();

      if (data?.error) {
        setError(data.error);
      } else {
        setResults(data?.results || []);
        setMeta(data);
      }
    } catch (err) {
      setError(err.message || "Search failed. Please try again.");
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-teal-600" />
            <span className="text-xl font-bold text-gray-800">Secroxy Search</span>
          </div>
          <Badge variant="outline" className="text-teal-600 border-teal-300 text-xs">Proxied</Badge>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Search Form */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search the web securely..."
                    className="pl-10 h-11 text-base"
                  />
                </div>
                <Button type="submit" disabled={loading || !query.trim()} className="h-11 px-6 bg-teal-600 hover:bg-teal-700">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <Label className="text-sm text-gray-600">Engine:</Label>
                  <Select value={engine} onValueChange={setEngine}>
                    <SelectTrigger className="w-44 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENGINES.map((e) => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="safe"
                    checked={safeSearch}
                    onCheckedChange={setSafeSearch}
                  />
                  <Label htmlFor="safe" className="text-sm text-gray-600 cursor-pointer">Safe Search</Label>
                </div>

                {meta && (
                  <span className="text-xs text-gray-400 ml-auto">
                    {meta.total} results via {meta.proxied_via}
                  </span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-16 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            <p className="text-sm">Searching securely via Secroxy...</p>
          </div>
        )}

        {/* Results */}
        {!loading && searched && results.length === 0 && !error && (
          <div className="text-center py-16 text-gray-400">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No results found. Try a different query or search engine.</p>
          </div>
        )}

        {openUrl && (
          <div className="fixed inset-0 z-50 bg-black/60 flex flex-col">
            <div className="bg-white flex items-center gap-2 px-4 py-2 shadow">
              <span className="text-sm text-gray-600 truncate flex-1">{openUrl}</span>
              <a href={openUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-800">
                <ExternalLink className="w-4 h-4" />
              </a>
              <button onClick={() => setOpenUrl(null)} className="text-gray-500 hover:text-red-600 font-bold text-lg leading-none ml-2">✕</button>
            </div>
            <iframe src={openUrl} className="flex-1 w-full border-0" title="result" />
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setOpenUrl(result.url)}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-blue-700 font-medium text-base leading-tight line-clamp-1">{result.title}</p>
                      <p className="text-xs text-green-700 truncate mt-0.5">{result.url}</p>
                      {result.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{result.description}</p>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 shrink-0 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !searched && (
          <div className="text-center py-20 text-gray-400">
            <Shield className="w-12 h-12 mx-auto mb-3 text-teal-200" />
            <p className="text-base font-medium text-gray-500">Anonymous Web Search</p>
            <p className="text-sm mt-1">Your searches are proxied through Secroxy for privacy.</p>
          </div>
        )}
      </div>
    </div>
  );
}