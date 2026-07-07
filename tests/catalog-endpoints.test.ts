import { describe, it } from "vitest";

import { createSpotifyClient } from "../src/index";
import { expectRequest, mockJsonFetch } from "./helpers";

describe("catalog and search endpoint groups", () => {
  it("covers album endpoints", async () => {
    const fetch = mockJsonFetch({});
    const spotify = createSpotifyClient({ accessToken: "token", fetch });

    await spotify.albums.getSeveral(["album-a", "album-b"], { market: "US" });
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/albums",
      search: { ids: "album-a,album-b", market: "US" },
    });

    await spotify.albums.getTracks("album-a", { limit: 10, offset: 5 });
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/albums/album-a/tracks",
      search: { limit: "10", offset: "5" },
    });

    await spotify.albums.save(["album-a"], { idsInBody: true });
    expectRequest(fetch, {
      method: "PUT",
      path: "https://api.spotify.com/v1/me/albums",
      body: { ids: ["album-a"] },
    });

    await spotify.albums.removeSaved(["album-a"]);
    expectRequest(fetch, {
      method: "DELETE",
      path: "https://api.spotify.com/v1/me/albums",
      search: { ids: "album-a" },
    });

    await spotify.albums.getNewReleases({ country: "SE", limit: 3 });
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/browse/new-releases",
      search: { country: "SE", limit: "3" },
    });
  });

  it("covers artist endpoints", async () => {
    const fetch = mockJsonFetch({});
    const spotify = createSpotifyClient({ accessToken: "token", fetch });

    await spotify.artists.get("artist/with slash");
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/artists/artist%2Fwith%20slash",
    });

    await spotify.artists.getAlbums("artist", {
      include_groups: ["album", "single"],
      market: "US",
      limit: 2,
    });
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/artists/artist/albums",
      search: { include_groups: "album,single", market: "US", limit: "2" },
    });

    await spotify.artists.getTopTracks("artist", { market: "GB" });
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/artists/artist/top-tracks",
      search: { market: "GB" },
    });

    await spotify.artists.getRelatedArtists("artist");
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/artists/artist/related-artists",
    });
  });

  it("covers audiobook, chapter, episode, show, and track endpoints", async () => {
    const fetch = mockJsonFetch({});
    const spotify = createSpotifyClient({ accessToken: "token", fetch });

    await spotify.audiobooks.getChapters("book", { market: "US", limit: 4 });
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/audiobooks/book/chapters",
      search: { market: "US", limit: "4" },
    });

    await spotify.chapters.getSeveral(["chapter-a", "chapter-b"], { market: "SE" });
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/chapters",
      search: { ids: "chapter-a,chapter-b", market: "SE" },
    });

    await spotify.episodes.checkSaved(["episode"]);
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/me/episodes/contains",
      search: { ids: "episode" },
    });

    await spotify.shows.getEpisodes("show", { limit: 5, market: "US" });
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/shows/show/episodes",
      search: { limit: "5", market: "US" },
    });

    await spotify.tracks.getAudioFeatures(["track-a", "track-b"]);
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/audio-features",
      search: { ids: "track-a,track-b" },
    });

    await spotify.tracks.getAudioAnalysis("track");
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/audio-analysis/track",
    });
  });

  it("covers browse, market, search, and recommendation endpoints", async () => {
    const fetch = mockJsonFetch({});
    const spotify = createSpotifyClient({ accessToken: "token", fetch });

    await spotify.categories.list({ locale: "sv_SE", limit: 8 });
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/browse/categories",
      search: { locale: "sv_SE", limit: "8" },
    });

    await spotify.categories.get("party", { locale: "en_US" });
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/browse/categories/party",
      search: { locale: "en_US" },
    });

    await spotify.genres.getAvailableSeeds();
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/recommendations/available-genre-seeds",
    });

    await spotify.markets.getAvailable();
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/markets",
    });

    await spotify.search.items("fox", ["artist", "track"], {
      market: "US",
      include_external: "audio",
    });
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/search",
      search: { q: "fox", type: "artist,track", include_external: "audio" },
    });

    await spotify.tracks.getRecommendations({
      seed_artists: ["artist-a", "artist-b"],
      seed_tracks: "track",
      min_energy: 0.5,
    });
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/recommendations",
      search: {
        seed_artists: "artist-a,artist-b",
        seed_tracks: "track",
        min_energy: "0.5",
      },
    });
  });
});
