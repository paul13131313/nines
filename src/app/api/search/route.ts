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

  const res = await fetch(
    `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(query)}&type=${type === "movie" ? "movie" : "series"}`
  );
  const data = await res.json();

  if (data.Response === "False" || !data.Search) return [];

  return data.Search
    .filter((item: { Poster: string }) => item.Poster !== "N/A")
    .slice(0, 6)
    .map((item: { Title: string; Poster: string; Year: string }) => ({
      title: item.Title,
      thumbnail_url: item.Poster,
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

  return data.data.map((item: { title: string; images: { jpg: { image_url: string } }; published: { prop: { from: { year: number } } } }) => ({
    title: item.title,
    thumbnail_url: item.images?.jpg?.image_url || "",
    type: "manga",
    year: item.published?.prop?.from?.year?.toString() || "",
  }));
}

async function searchGoogleBooks(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;
  if (!apiKey) return [];

  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${apiKey}&maxResults=6`
  );
  const data = await res.json();

  if (!data.items) return [];

  return data.items
    .filter((item: { volumeInfo: { imageLinks?: { thumbnail: string } } }) => item.volumeInfo?.imageLinks?.thumbnail)
    .map((item: { volumeInfo: { title: string; imageLinks: { thumbnail: string }; publishedDate?: string } }) => ({
      title: item.volumeInfo.title,
      thumbnail_url: item.volumeInfo.imageLinks.thumbnail.replace("http:", "https:"),
      type: "book",
      year: item.volumeInfo.publishedDate?.slice(0, 4) || "",
    }));
}

async function searchMusic(query: string): Promise<SearchResult[]> {
  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=album&limit=6`
  );
  const data = await res.json();

  if (!data.results) return [];

  return data.results.map((item: { collectionName: string; artworkUrl100: string; releaseDate: string; artistName: string }) => ({
    title: `${item.collectionName} - ${item.artistName}`,
    thumbnail_url: item.artworkUrl100?.replace("100x100", "300x300") || "",
    type: "music",
    year: item.releaseDate?.slice(0, 4) || "",
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

  return data.results
    .filter((item: { background_image: string }) => item.background_image)
    .map((item: { name: string; background_image: string; released: string }) => ({
      title: item.name,
      thumbnail_url: item.background_image,
      type: "game",
      year: item.released?.slice(0, 4) || "",
    }));
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  const type = request.nextUrl.searchParams.get("type");

  if (!q) return NextResponse.json([]);

  try {
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
      case "music":
        results = await searchMusic(q);
        break;
      default:
        results = await searchOMDB(q, "movie");
        break;
    }

    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
