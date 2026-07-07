import { pickQuery, requestOptions } from "../internal";
import type {
  DeviceTargetOptions,
  PlayerStateOptions,
  RecentlyPlayedOptions,
  Requester,
  TransferPlaybackOptions,
} from "../internal";
import type {
  CursorPaging,
  Device,
  PlaybackState,
  Queue,
  RequestOptions,
  StartPlaybackBody,
  Track,
} from "../types";

interface DevicesBody {
  device_ids: readonly string[];
  play?: boolean;
}

export function createPlayerApi(request: Requester) {
  return {
    getPlaybackState: (options?: PlayerStateOptions) =>
      request<PlaybackState>({
        method: "GET",
        path: "/me/player",
        query: pickQuery(options, ["market", "additional_types"]),
        ...requestOptions(options),
      }),
    transferPlayback: (
      deviceIds: readonly string[],
      options?: TransferPlaybackOptions,
    ) =>
      request<void>({
        method: "PUT",
        path: "/me/player",
        body: { device_ids: deviceIds, play: options?.play } satisfies DevicesBody,
        ...requestOptions(options),
      }),
    getAvailableDevices: (options?: RequestOptions) =>
      request<{ devices: Device[] }>({
        method: "GET",
        path: "/me/player/devices",
        ...requestOptions(options),
      }),
    getCurrentlyPlaying: (options?: PlayerStateOptions) =>
      request<PlaybackState>({
        method: "GET",
        path: "/me/player/currently-playing",
        query: pickQuery(options, ["market", "additional_types"]),
        ...requestOptions(options),
      }),
    startResumePlayback: (
      body: StartPlaybackBody = {},
      options?: DeviceTargetOptions,
    ) =>
      request<void>({
        method: "PUT",
        path: "/me/player/play",
        query: pickQuery(options, ["device_id"]),
        body,
        ...requestOptions(options),
      }),
    pause: (options?: DeviceTargetOptions) =>
      request<void>({
        method: "PUT",
        path: "/me/player/pause",
        query: pickQuery(options, ["device_id"]),
        ...requestOptions(options),
      }),
    skipToNext: (options?: DeviceTargetOptions) =>
      request<void>({
        method: "POST",
        path: "/me/player/next",
        query: pickQuery(options, ["device_id"]),
        ...requestOptions(options),
      }),
    skipToPrevious: (options?: DeviceTargetOptions) =>
      request<void>({
        method: "POST",
        path: "/me/player/previous",
        query: pickQuery(options, ["device_id"]),
        ...requestOptions(options),
      }),
    seek: (positionMs: number, options?: DeviceTargetOptions) =>
      request<void>({
        method: "PUT",
        path: "/me/player/seek",
        query: { position_ms: positionMs, ...pickQuery(options, ["device_id"]) },
        ...requestOptions(options),
      }),
    setRepeat: (
      state: "track" | "context" | "off",
      options?: DeviceTargetOptions,
    ) =>
      request<void>({
        method: "PUT",
        path: "/me/player/repeat",
        query: { state, ...pickQuery(options, ["device_id"]) },
        ...requestOptions(options),
      }),
    setVolume: (volumePercent: number, options?: DeviceTargetOptions) =>
      request<void>({
        method: "PUT",
        path: "/me/player/volume",
        query: { volume_percent: volumePercent, ...pickQuery(options, ["device_id"]) },
        ...requestOptions(options),
      }),
    setShuffle: (state: boolean, options?: DeviceTargetOptions) =>
      request<void>({
        method: "PUT",
        path: "/me/player/shuffle",
        query: { state, ...pickQuery(options, ["device_id"]) },
        ...requestOptions(options),
      }),
    getRecentlyPlayed: (options?: RecentlyPlayedOptions) =>
      request<CursorPaging<{ track: Track; played_at: string; context: unknown }>>({
        method: "GET",
        path: "/me/player/recently-played",
        query: pickQuery(options, ["limit", "after", "before"]),
        ...requestOptions(options),
      }),
    getQueue: (options?: RequestOptions) =>
      request<Queue>({
        method: "GET",
        path: "/me/player/queue",
        ...requestOptions(options),
      }),
    addToQueue: (uri: string, options?: DeviceTargetOptions) =>
      request<void>({
        method: "POST",
        path: "/me/player/queue",
        query: { uri, ...pickQuery(options, ["device_id"]) },
        ...requestOptions(options),
      }),
  };
}
