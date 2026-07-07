import { ids, libraryPath } from "../core";
import { requestOptions, saveIds } from "../internal";
import type { Requester, SaveOptions } from "../internal";
import type { LibraryItemType, RequestOptions } from "../types";

export function createLibraryApi(request: Requester) {
  return {
    save: (type: LibraryItemType, itemIds: readonly string[], options?: SaveOptions) =>
      saveIds(request, "PUT", `/me/${libraryPath(type)}`, itemIds, options),
    remove: (type: LibraryItemType, itemIds: readonly string[], options?: SaveOptions) =>
      saveIds(request, "DELETE", `/me/${libraryPath(type)}`, itemIds, options),
    check: (type: LibraryItemType, itemIds: readonly string[], options?: RequestOptions) =>
      request<boolean[]>({
        method: "GET",
        path: `/me/${libraryPath(type)}/contains`,
        query: { ids: ids(itemIds) },
        ...requestOptions(options),
      }),
  };
}
