# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MojiDoodle is a Japanese character practice application (文字の練習) built with Ionic Angular and Capacitor.

## Commands

```bash
ionic serve              # Dev server at localhost:8100
ionic build --prod       # Production build
ng test                  # Unit tests
ng lint                  # Linting

# Native platforms
ionic capacitor add ios
ionic capacitor add android
ionic capacitor sync      # Sync web code to native
ionic capacitor open ios  # Open in Xcode
```

## Architecture

**Stack**: Ionic 8 / Angular 20 / Capacitor 8
**App ID**: `com.lexab.mojidoodle`

**Key paths**:
- `src/app/` - Components and routing
- `src/app/folder/` - Sidemenu page template
- `src/theme/variables.scss` - Ionic theme colors
- `src/app/app.component.ts` - Sidemenu items (`appPages` array)
