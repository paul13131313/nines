import { NextRequest, NextResponse } from "next/server";

interface SearchResult {
  title: string;
  thumbnail_url: string;
  type: string;
  year: string;
}

async function searchOMDB(query: string, type: "movie" | "series"): Promise<SearchResult[]> {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) return [];

  const omdbType = type === "movie" ? "movie" : "series";
  const res = await fetch(
    `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(query)}&type=${omdbType}`
  );
  const data = await res.json();

  if (data.Response === "False" || !data.Search) return [];

  return data.Search.slice(0, 6).map((item: { Title: string; Poster: string; Year: string }) => ({
    title: item.Title,
    thumbnail_url: item.Poster !== "N/A" ? item.Poster : "",
    type: type === "series" ? "drama" : "movie",
    year: item.Year,
  }));
}

async function searchJikan(query: string): Promise<SearchResult[]> {
  const res = await fetch(
    `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=6`
  );
  const data = await res.json();

  if (!data.data) return [];

  return data.data.map((item: { title: string; images: { jpg: { image_url: string } }; published: { from: string } }) => ({
    title: item.title,
    thumbnail_url: item.images?.jpg?.image_url || "",
    type: "manga",
    year: item.published?.from ? new Date(item.published.from).getFullYear().toString() : "",
  }));
}

async function searchGoogleBooks(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;
  if (!apiKey) return [];

  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${apiKey}&langRestrict=ja&maxResults=6`
  );
  const data = await res.json();

  if (!data.items) return [];

  return data.items.map((item: { volumeInfo: { title: string; imageLinks?: { thumbnail: string }; publishedDate?: string } }) => ({
    title: item.volumeInfo.title,
    thumbnail_url: item.volumeInfo.imageLinks?.thumbnail || "",
    type: "book",
    year: item.volumeInfo.publishedDate?.slice(0, 4) || "",
  }));
}

async function searchRAWG(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) return [];

  const res = await fetch(
    `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=6`
  );
  const data = await res.json();

  if (!data.results) return [];

  return data.results.map((item: { name: string; background_image: string; released: string }) => ({
    title: item.name,
    thumbnail_url: item.background_image || "",
    type: "game",
    year: item.released?.slice(0, 4) || "",
  }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const type = searchParams.get("type");

  if (!q) {
    return NextResponse.json({ error: "q parameter required" }, { status: 400 });
  }

  let results: SearchResult[] = [];

  switch (type) {
    case "movie":
      results = await searchOMDB(q, "movie");
      break;
    case "drama":
      results = await searchOMDB(q, "series");
      break;
    case "manga":
      results = await searchJikan(q);
      break;
    case "book":
      results = await searchGoogleBooks(q);
      break;
    case "game":
      results = await searchRAWG(q);
      break;
    default:
      results = await searchOMDB(q, "movie");
      break;
  }

  return NextResponse.json(results);
}
