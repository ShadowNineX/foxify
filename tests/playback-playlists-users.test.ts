import { describe, expect, it } from "vitest";

import { createSpotifyClient } from "../src/index";
import {
  expectRequest,
  firstCall,
  lastCall,
  mockFetch,
  mockJsonFetch,
} from "./helpers";

describe("playback endpoints", () => {
  it("covers player state and device controls", async () => {
    const fetch = mockJsonFetch({});
    const spotify = createSpotifyClient({ accessToken: "token", fetch });

    await spotify.player.getPlaybackState({ market: "US", additional_types: ["episode"] });
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/me/player",
      search: { market: "US", additional_types: "episode" },
    });

    await spotify.player.transferPlayback(["device"], { play: true });
    expectRequest(fetch, {
      method: "PUT",
      path: "https://api.spotify.com/v1/me/player",
      body: { device_ids: ["device"], play: true },
    });

    await spotify.player.startResumePlayback(
      { uris: ["spotify:track:one"], position_ms: 1000 },
      { device_id: "device" },
    );
    expectRequest(fetch, {
      method: "PUT",
      path: "https://api.spotify.com/v1/me/player/play",
      search: { device_id: "device" },
      body: { uris: ["spotify:track:one"], position_ms: 1000 },
    });
  });

  it("covers player actions and queue endpoints", async () => {
    const fetch = mockJsonFetch({});
    const spotify = createSpotifyClient({ accessToken: "token", fetch });

    await spotify.player.seek(42, { device_id: "device" });
    expectRequest(fetch, {
      method: "PUT",
      path: "https://api.spotify.com/v1/me/player/seek",
      search: { position_ms: "42", device_id: "device" },
    });

    await spotify.player.setRepeat("track");
    expectRequest(fetch, {
      method: "PUT",
      path: "https://api.spotify.com/v1/me/player/repeat",
      search: { state: "track" },
    });

    await spotify.player.setVolume(55);
    expectRequest(fetch, {
      method: "PUT",
      path: "https://api.spotify.com/v1/me/player/volume",
      search: { volume_percent: "55" },
    });

    await spotify.player.setShuffle(true);
    expectRequest(fetch, {
      method: "PUT",
      path: "https://api.spotify.com/v1/me/player/shuffle",
      search: { state: "true" },
    });

    await spotify.player.addToQueue("spotify:track:one", { device_id: "device" });
    expectRequest(fetch, {
      method: "POST",
      path: "https://api.spotify.com/v1/me/player/queue",
      search: { uri: "spotify:track:one", device_id: "device" },
    });

    await spotify.player.getRecentlyPlayed({ limit: 2, after: 100 });
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/me/player/recently-played",
      search: { limit: "2", after: "100" },
    });
  });
});

describe("playlist endpoints", () => {
  it("covers playlist reads and mutations", async () => {
    const fetch = mockJsonFetch({ snapshot_id: "snapshot" });
    const spotify = createSpotifyClient({ accessToken: "token", fetch });

    await spotify.playlists.get("playlist", {
      market: "US",
      fields: "items",
      additional_types: "episode",
    });
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/playlists/playlist",
      search: { market: "US", fields: "items", additional_types: "episode" },
    });

    await spotify.playlists.changeDetails("playlist", {
      name: "New name",
      public: false,
    });
    expectRequest(fetch, {
      method: "PUT",
      path: "https://api.spotify.com/v1/playlists/playlist",
      body: { name: "New name", public: false },
    });

    await spotify.playlists.changeDetails("playlist", {
      public: true,
    });
    expectRequest(fetch, {
      method: "PUT",
      path: "https://api.spotify.com/v1/playlists/playlist",
      body: { public: true },
    });

    await spotify.playlists.updateItems("playlist", {
      uris: ["spotify:track:one"],
      range_start: 0,
    });
    expectRequest(fetch, {
      method: "PUT",
      path: "https://api.spotify.com/v1/playlists/playlist/items",
      body: { uris: ["spotify:track:one"], range_start: 0 },
    });

    await spotify.playlists.removeItems("playlist", {
      tracks: [{ uri: "spotify:track:one" }],
    });
    expectRequest(fetch, {
      method: "DELETE",
      path: "https://api.spotify.com/v1/playlists/playlist/items",
      body: { tracks: [{ uri: "spotify:track:one" }] },
    });
  });

  it("covers deprecated playlist item paths and cover uploads", async () => {
    const fetch = mockJsonFetch({ snapshot_id: "snapshot" });
    const spotify = createSpotifyClient({ accessToken: "token", fetch });

    await spotify.playlists.addItemsDeprecated("playlist", ["spotify:track:one"]);
    expectRequest(fetch, {
      method: "POST",
      path: "https://api.spotify.com/v1/playlists/playlist/tracks",
      body: { uris: ["spotify:track:one"] },
    });

    await spotify.playlists.removeItemsDeprecated("playlist", {
      tracks: [{ uri: "spotify:track:one" }],
    });
    expectRequest(fetch, {
      method: "DELETE",
      path: "https://api.spotify.com/v1/playlists/playlist/tracks",
      body: { tracks: [{ uri: "spotify:track:one" }] },
    });

    await spotify.playlists.getCoverImage("playlist");
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/playlists/playlist/images",
    });

    await spotify.playlists.uploadCustomCoverImage("playlist", "base64-image", {
      headers: { "x-extra": "yes" },
    });
    expectRequest(fetch, {
      method: "PUT",
      path: "https://api.spotify.com/v1/playlists/playlist/images",
      headers: { "content-type": "image/jpeg", "x-extra": "yes" },
    });
    let [, init] = lastCall(fetch);
    expect(init?.body).toBe("base64-image");

    await spotify.playlists.addCustomCoverImage("playlist", "legacy-base64-image");
    expectRequest(fetch, {
      method: "PUT",
      path: "https://api.spotify.com/v1/playlists/playlist/images",
      headers: { "content-type": "image/jpeg" },
    });
    [, init] = lastCall(fetch);
    expect(init?.body).toBe("legacy-base64-image");
  });

  it("validates Spotify's custom playlist cover image payload size", async () => {
    const fetch = mockJsonFetch();
    const spotify = createSpotifyClient({ accessToken: "token", fetch });
    const atLimitImage = "a".repeat(256 * 1024);
    const tooLargeImage = "a".repeat(256 * 1024 + 1);

    await spotify.playlists.uploadCustomCoverImage("playlist", atLimitImage);
    let [, init] = lastCall(fetch);
    expect(init?.body).toBe(atLimitImage);

    expect(() =>
      spotify.playlists.uploadCustomCoverImage("playlist", tooLargeImage),
    ).toThrow(/256 KB or smaller/);

    await spotify.playlists.uploadCustomCoverImage(
      "playlist",
      tooLargeImage,
      { validatePayloadSize: false },
    );
    [, init] = lastCall(fetch);
    expect(init?.body).toBe(tooLargeImage);
  });

  it("covers user and browse playlist helpers", async () => {
    const fetch = mockJsonFetch({});
    const spotify = createSpotifyClient({ accessToken: "token", fetch });

    await spotify.playlists.getCurrentUserPlaylists({ limit: 1 });
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/me/playlists",
      search: { limit: "1" },
    });

    await spotify.playlists.create({
      name: "Mix",
      description: "A mix",
      public: false,
      collaborative: false,
    });
    expectRequest(fetch, {
      method: "POST",
      path: "https://api.spotify.com/v1/me/playlists",
      body: {
        name: "Mix",
        description: "A mix",
        public: false,
        collaborative: false,
      },
    });

    await spotify.playlists.createForUser("user", {
      name: "Mix",
      public: true,
    });
    expectRequest(fetch, {
      method: "POST",
      path: "https://api.spotify.com/v1/users/user/playlists",
      body: { name: "Mix", public: true },
    });

    await spotify.playlists.getFeatured({ country: "US", locale: "en_US" });
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/browse/featured-playlists",
      search: { country: "US", locale: "en_US" },
    });

    await spotify.playlists.getCategoryPlaylists("party", { country: "SE" });
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/browse/categories/party/playlists",
      search: { country: "SE" },
    });
  });
});

describe("library and user endpoints", () => {
  it("covers generic library helpers", async () => {
    const fetch = mockJsonFetch({});
    const spotify = createSpotifyClient({ accessToken: "token", fetch });

    await spotify.library.save("track", ["track"], { idsInBody: true });
    expectRequest(fetch, {
      method: "PUT",
      path: "https://api.spotify.com/v1/me/tracks",
      body: { ids: ["track"] },
    });

    await spotify.library.remove("show", ["show"]);
    expectRequest(fetch, {
      method: "DELETE",
      path: "https://api.spotify.com/v1/me/shows",
      search: { ids: "show" },
    });

    await spotify.library.check("episode", ["episode"]);
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/me/episodes/contains",
      search: { ids: "episode" },
    });
  });

  it("covers user profile, follow, and follower helpers", async () => {
    const fetch = mockFetch(async () => new Response(null, { status: 204 }));
    const spotify = createSpotifyClient({ accessToken: "token", fetch });

    await spotify.users.getCurrentProfile();
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/me",
    });

    await spotify.users.getTopItems("tracks", { time_range: "short_term", limit: 5 });
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/me/top/tracks",
      search: { time_range: "short_term", limit: "5" },
    });

    await spotify.users.followPlaylist("playlist", { public: false });
    expectRequest(fetch, {
      method: "PUT",
      path: "https://api.spotify.com/v1/playlists/playlist/followers",
      body: { public: false },
    });

    await spotify.users.follow("artist", ["artist"], { idsInBody: true });
    expectRequest(fetch, {
      method: "PUT",
      path: "https://api.spotify.com/v1/me/following",
      search: { type: "artist" },
      body: { ids: ["artist"] },
    });

    await spotify.users.checkPlaylistFollowers("playlist", ["user-a", "user-b"]);
    expectRequest(fetch, {
      method: "GET",
      path: "https://api.spotify.com/v1/playlists/playlist/followers/contains",
      search: { ids: "user-a,user-b" },
    });
  });
});
