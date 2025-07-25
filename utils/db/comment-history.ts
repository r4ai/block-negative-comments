import { type IDBPObjectStore, openDB } from "idb"
import type { CommentHistoryItem } from "../messaging"
import type { PartiallyPartial } from "../utility-types"

const KEY_COMMENTS = "comments"

type CommentDB = { [KEY_COMMENTS]: CommentHistoryItem }

const openingDB = openDB<CommentDB>("comment-history", 1, {
  upgrade: (db) => {
    if (!db.objectStoreNames.contains(KEY_COMMENTS)) {
      const store = db.createObjectStore(KEY_COMMENTS, {
        keyPath: "id",
        autoIncrement: true,
      })
      store.createIndex("analyzedAt", "analyzedAt")
    }
  },
})

const getOldestComment = async (
  store: IDBPObjectStore<
    CommentDB,
    (typeof KEY_COMMENTS)[],
    typeof KEY_COMMENTS,
    "readwrite"
  >,
): Promise<CommentHistoryItem | undefined> => {
  const index = store.index("analyzedAt")
  const cursor = await index.openCursor()
  return cursor?.value || undefined
}

export const addCommentToHistory = async (
  comment: PartiallyPartial<CommentHistoryItem, "id">,
) => {
  const maxCommentHistory =
    await developmentSettings.maxCommentHistory.getValue()
  const db = await openingDB
  const tx = db.transaction(KEY_COMMENTS, "readwrite")

  // Remove the oldest comment if the limit is reached
  const commentsLength = await tx.store.count()
  if (commentsLength >= maxCommentHistory) {
    const oldestComment = await getOldestComment(tx.store)
    if (oldestComment) {
      await tx.store.delete(oldestComment.id)
    }
  }

  // Add the new comment
  tx.store.add(comment)

  await tx.done
}

export const getAllCommentsFromHistory = async () => {
  const db = await openingDB
  const tx = db.transaction(KEY_COMMENTS, "readonly")
  const comments: CommentHistoryItem[] = await tx.store.getAll()
  await tx.done
  return comments
}
