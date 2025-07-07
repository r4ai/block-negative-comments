# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser extension that automatically blocks negative comments on YouTube using AI sentiment analysis. The extension uses WebGPU-accelerated machine learning models to analyze comment sentiment in real-time and applies a blur filter to negative comments.

## Development Commands

- `bun dev` - Start development server for Chrome
- `bun dev:firefox` - Start development server for Firefox
- `bun build` - Build extension for Chrome
- `bun build:firefox` - Build extension for Firefox
- `bun zip` - Create ZIP package for Chrome
- `bun zip:firefox` - Create ZIP package for Firefox
- `bun compile` - TypeScript compilation check
- `bun check` - Run Biome linter and formatter
- `bun check:write` - Run Biome with auto-fix

## Code Architecture

### Entry Points

- `entrypoints/background.ts` - Background script that handles AI sentiment analysis using Hugging Face Transformers
- `entrypoints/content.ts` - Content script that monitors YouTube comments and applies visual filters
- `entrypoints/popup/` - Extension popup UI built with React

### Key Components

#### Background Script (`entrypoints/background.ts`)

- Initializes a WebGPU-accelerated text generation pipeline using Phi-3.5-mini-instruct
- Handles `analyzeSentiment` messages from content script
- Parses AI model output to extract sentiment and confidence scores
- Uses custom output parsing with regex to handle model responses

#### Content Script (`entrypoints/content.ts`)

- `BlockNegativeComments` class manages YouTube comment monitoring
- Uses MutationObserver to detect new comments in YouTube live chat
- Applies temporary blur filter to comments while analyzing sentiment
- `TaskQueue` class manages sequential processing of sentiment analysis requests
- Custom `Logger` class provides filtered console output

#### Messaging (`utils/messaging.ts`)

- Type-safe messaging between content and background scripts using `@webext-core/messaging`
- Defines `BlockNegativeCommentsProtocol` interface for message structure

### Configuration

- WXT framework for extension development
- Biome for linting and formatting (double quotes, no semicolons)
- TypeScript with React JSX
- Manifest V3 permissions: activeTab, scripting, contextMenus, storage, unlimitedStorage
- Host permissions limited to YouTube domains
- CSP allows WASM execution for ML models
