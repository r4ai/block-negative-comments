import dedent from "dedent"
import { type CommentHistoryItem, sendMessage } from "@/utils/messaging"
import {
  developmentSettings,
  generalSettings,
  modelSettings,
} from "@/utils/storage"
import type { PartiallyPartial } from "@/utils/utility-types"

class Logger {
  private filters = {
    debug: true,
    info: true,
    warn: true,
    error: true,
  }
  private prefix: string = "[BlockNegativeComments]"

  constructor(filters: Partial<typeof this.filters> = {}) {
    this.filters = { ...this.filters, ...filters }
  }

  public setFilters(filters: Partial<typeof this.filters>) {
    this.filters = { ...this.filters, ...filters }
  }

  public getFilters() {
    return this.filters
  }

  public debug(...messages: unknown[]) {
    if (!this.filters.debug) return
    console.log(this.prefix, ...messages)
  }

  public log(...messages: unknown[]) {
    if (!this.filters.info) return
    console.log(this.prefix, ...messages)
  }

  public warn(...messages: unknown[]) {
    if (!this.filters.warn) return
    console.warn(this.prefix, ...messages)
  }

  public error(...messages: unknown[]) {
    if (!this.filters.error) return
    console.error(this.prefix, ...messages)
  }
}

type Task = () => Promise<void>

class TaskQueue {
  private queue: Task[] = []
  private isRunning: boolean = false

  public push(task: Task): void {
    this.queue.push(task)
    this.processQueue()
  }

  private async processQueue(): Promise<void> {
    if (this.isRunning || this.queue.length === 0) {
      return
    }

    this.isRunning = true
    const task = this.queue.shift()
    if (task) {
      try {
        await task()
      } catch (error) {
        console.error("Error processing task:", error)
      }
    }
    this.isRunning = false

    // 再帰的に次のタスクを処理
    this.processQueue()
  }
}

// 基本的なYouTubeコメントモザイククラス
class BlockNegativeComments {
  private ytdAppObserver: MutationObserver
  private ytdLiveChatObserver: MutationObserver

  private logger: Logger

  private processedComments: Set<HTMLElement> = new Set()
  private blockedComments: Set<HTMLElement> = new Set()
  private processingComments: TaskQueue = new TaskQueue()

  private running: boolean = false

  private selectors = {
    ytdApp: "ytd-app",
    ytdPageManager: "ytd-page-manager",
    ytdWatchFlexy: "ytd-watch-flexy",
    ytdLiveChatFrame: "ytd-live-chat-frame",
    ytdLiveChatFrameIframe: "iframe#chatframe",
    ytLiveChatTextMessageRenderer: "yt-live-chat-text-message-renderer",
    ytLiveChatTextMessageRendererMessage: "#message",
  }

  constructor({ logger }: { logger: Logger }) {
    this.logger = logger

    let isFirstLoad = true
    this.ytdLiveChatObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement
              switch (element.tagName.toLowerCase()) {
                case this.selectors.ytLiveChatTextMessageRenderer:
                  if (isFirstLoad) {
                    this.logger.debug(
                      "First load detected, skipping mosaic application for initial comments",
                    )
                    setTimeout(() => {
                      isFirstLoad = false
                      this.logger.debug(
                        "Resuming mosaic application after initial load",
                      )
                    }, 1000)
                    return
                  }
                  this.logger.debug(
                    "Loaded yt-live-chat-text-message-renderer element",
                  )
                  this.applyMosaic(element)
                  this.processedComments.add(element)
                  break
              }
            }
          })
        }
      })
    })

    this.ytdAppObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement
              switch (element.tagName.toLowerCase()) {
                case this.selectors.ytdPageManager:
                  this.logger.debug(
                    `Loaded ${this.selectors.ytdPageManager} element`,
                  )
                  break
                case this.selectors.ytdWatchFlexy:
                  this.logger.debug(
                    `Loaded ${this.selectors.ytdWatchFlexy} element`,
                  )
                  break
                case this.selectors.ytdLiveChatFrame: {
                  this.logger.debug(
                    `Loaded ${this.selectors.ytdLiveChatFrame} element`,
                  )
                  const iframe: HTMLIFrameElement | null =
                    element.querySelector(this.selectors.ytdLiveChatFrameIframe)
                  if (iframe) {
                    this.logger.debug(
                      `Found ${this.selectors.ytdLiveChatFrameIframe} element`,
                    )
                    iframe.onload = () => {
                      if (iframe.contentDocument) {
                        this.logger.debug(
                          `Loaded ${this.selectors.ytdLiveChatFrameIframe} element's contentDocument`,
                        )
                        this.ytdLiveChatObserver.observe(
                          iframe.contentDocument,
                          {
                            childList: true,
                            subtree: true,
                          },
                        )
                        this.logger.debug(
                          `Started observing ${this.selectors.ytdLiveChatFrameIframe} element's contentDocument`,
                        )
                      } else {
                        this.logger.warn(
                          `Failed to load ${this.selectors.ytdLiveChatFrameIframe} element's contentDocument`,
                        )
                      }
                    }
                  } else {
                    this.logger.warn(
                      `Failed to find ${this.selectors.ytdLiveChatFrameIframe} element`,
                    )
                  }
                  break
                }
              }
            }
          })
        }
      })
    })
  }

  private startObserving(): void {
    const ytdApp = document.querySelector(this.selectors.ytdApp)
    if (ytdApp) {
      this.ytdAppObserver.observe(ytdApp, {
        childList: true,
        subtree: true,
      })
      this.running = true
      this.logger.debug(`Started observing ${this.selectors.ytdApp} element`)
    } else {
      this.logger.error(`Failed to find ${this.selectors.ytdApp} element`)
    }
  }

  protected applyMosaic(commentElement: HTMLElement): void {
    if (!commentElement || this.processedComments.has(commentElement)) {
      return
    }

    // モザイクスタイルを適用
    const originalStyle: string = commentElement.style.cssText
    commentElement.style.cssText += dedent`
        filter: blur(5px);
        background-color: rgba(0, 0, 0, 0.1);
        transition: filter 0.3s ease;
      `

    const comment =
      commentElement
        .querySelector(this.selectors.ytLiveChatTextMessageRendererMessage)
        ?.textContent?.trim() ?? ""
    this.processingComments.push(async () => {
      const model = await generalSettings.selectedModel.getValue()
      const res = await sendMessage("analyzeSentiment", { comment, model })
      this.logger.debug(
        `Sentiment Analysis Result for comment:`,
        `${commentElement.textContent?.substring(0, 20)}...`,
        res,
      )
      const commentHistoryItem: PartiallyPartial<CommentHistoryItem, "id"> = {
        analyzedAt: new Date().toISOString(),
        comment,
        result: res,
      }
      sendMessage("addCommentToHistory", commentHistoryItem)
        .then(() => {
          this.logger.debug(`Saved a comment to history`)
        })
        .catch(() => {
          this.logger.error(
            `Failed to save a comment to history: ${JSON.stringify(commentHistoryItem)}`,
          )
        })

      switch (res.modelName) {
        case "onnx-community/Phi-3.5-mini-instruct-onnx-web": {
          const settings = await modelSettings[res.modelName].getValue()
          if (
            res.sentiment === "negative" &&
            res.confidence > settings.confidenceThreshold
          ) {
            this.logger.debug(
              `Blocking negative comment: ${commentElement.textContent}`,
            )
            this.blockedComments.add(commentElement)
          } else {
            this.logger.debug(
              `Unblocking comment: ${commentElement.textContent}`,
            )
            commentElement.style.cssText = originalStyle
            commentElement.style.transition = "filter 0.3s ease"
          }
          break
        }

        case "tabularisai/multilingual-sentiment-analysis": {
          const settings = await modelSettings[res.modelName].getValue()
          if (
            (res.sentiment === "negative" ||
              res.sentiment === "very_negative") &&
            res.score > settings.scoreThreshold
          ) {
            this.logger.debug(
              `Blocking negative comment: ${commentElement.textContent}`,
            )
            this.blockedComments.add(commentElement)
          } else {
            this.logger.debug(
              `Unblocking comment: ${commentElement.textContent}`,
            )
            commentElement.style.cssText = originalStyle
            commentElement.style.transition = "filter 0.3s ease"
          }
          break
        }
      }
    })

    this.logger.debug(
      "Applying mosaic to comment:",
      `${commentElement.textContent?.substring(0, 20)}...`,
    )
  }

  public stop() {
    if (this.running) {
      this.ytdAppObserver.disconnect()
      this.ytdLiveChatObserver.disconnect()
      this.running = false
      this.logger.log("Stopped observing YouTube Live Chat")
    }
  }

  public start() {
    if (!this.running) {
      this.startObserving()
    }
  }
}

export default defineContentScript({
  matches: ["https://*.youtube.com/*"],
  async main() {
    // Init logger
    const logFilter = await developmentSettings.logFilter.getValue()
    const logger = new Logger(logFilter)
    developmentSettings.logFilter.watch((newFilter) => {
      logger.setFilters(newFilter)
    })

    // Init manager
    const manager = new BlockNegativeComments({ logger })
    if (await generalSettings.enabled.getValue()) {
      manager.start()
    }

    generalSettings.enabled.watch((enabled) => {
      if (enabled) {
        location.reload()
      } else {
        manager.stop()
      }
    })

    logger.log("YouTubeコメントモザイク機能が初期化されました")
  },
})
