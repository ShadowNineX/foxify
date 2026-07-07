import { encodePath, ids } from "../core";
import { pickQuery, requestOptions, saveIds } from "../internal";
import type {
  CursorPagingOptions,
  FollowPlaylistOptions,
  Requester,
  SaveOptions,
  TopItemsOptions,
} from "../internal";
import type {
  Artist,
  CursorPaging,
  FollowType,
  Paging,
  RequestOptions,
  TopItemType,
  Track,
  UserProfile,
} from "../types";

export function createUsersApi(request: Requester) {
  return {
    getCurrentProfile: (options?: RequestOptions) =>
      request<UserProfile>({
        method: "GET",
        path: "/me",
        ...requestOptions(options),
      }),
    getTopItems: (type: TopItemType, options?: TopItemsOptions) =>
      request<Paging<Artist | Track>>({
        method: "GET",
        path: `/me/top/${type}`,
        query: pickQuery(options, ["time_range", "limit", "offset"]),
        ...requestOptions(options),
      }),
    getProfile: (userId: string, options?: RequestOptions) =>
      request<UserProfile>({
        method: "GET",
        path: `/users/${encodePath(userId)}`,
        ...requestOptions(options),
      }),
    followPlaylist: (
      playlistId: string,
      options?: FollowPlaylistOptions,
    ) =>
      request<void>({
        method: "PUT",
        path: `/playlists/${encodePath(playlistId)}/followers`,
        body: options?.public === undefined ? undefined : { public: options.public },
        ...requestOptions(options),
      }),
    unfollowPlaylist: (playlistId: string, options?: RequestOptions) =>
      request<void>({
        method: "DELETE",
        path: `/playlists/${encodePath(playlistId)}/followers`,
        ...requestOptions(options),
      }),
    getFollowedArtists: (options?: CursorPagingOptions) =>
      request<CursorPaging<Artist>>({
        method: "GET",
        path: "/me/following",
        query: { type: "artist", ...pickQuery(options, ["after", "limit"]) },
        ...requestOptions(options),
      }),
    follow: (type: FollowType, targetIds: readonly string[], options?: SaveOptions) =>
      saveIds(request, "PUT", "/me/following", targetIds, {
        ...options,
        idsInBody: options?.idsInBody,
        headers: options?.headers,
      }, { type }),
    unfollow: (type: FollowType, targetIds: readonly string[], options?: SaveOptions) =>
      saveIds(request, "DELETE", "/me/following", targetIds, options, { type }),
    checkFollowing: (type: FollowType, targetIds: readonly string[], options?: RequestOptions) =>
      request<boolean[]>({
        method: "GET",
        path: "/me/following/contains",
        query: { type, ids: ids(targetIds) },
        ...requestOptions(options),
      }),
    checkPlaylistFollowers: (
      playlistId: string,
      userIds: readonly string[],
      options?: RequestOptions,
    ) =>
      request<boolean[]>({
        method: "GET",
        path: `/playlists/${encodePath(playlistId)}/followers/contains`,
        query: { ids: ids(userIds) },
        ...requestOptions(options),
      }),
  };
}
