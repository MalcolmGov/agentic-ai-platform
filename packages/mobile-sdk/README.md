# @swifter-ai/mobile-sdk

Embed AI agents in your React Native, iOS, and Android apps with a single package. Built for African markets — data residency compliant, multilingual, and production-ready.

[![npm version](https://img.shields.io/npm/v/@swifter-ai/mobile-sdk.svg)](https://www.npmjs.com/package/@swifter-ai/mobile-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Installation

```bash
npm install @swifter-ai/mobile-sdk
# or
yarn add @swifter-ai/mobile-sdk
```

---

## Quick Start

```tsx
import React from 'react'
import { AgenticProvider, AgentChat } from '@swifter-ai/mobile-sdk'

const agenticConfig = {
  apiKey: 'your-api-key',
  appId: 'your-app-id',
  market: 'za',  // South Africa
  theme: {
    primaryColor: '#3b82f6',
  },
}

const hrAgentConfig = {
  agentId: 'hr-onboarding-agent',
  model: 'gpt-4o-mini',
  language: 'en',
  welcomeMessage: 'Hi! I can help with HR queries, leave requests, and onboarding.',
}

export default function App() {
  return (
    <AgenticProvider config={agenticConfig}>
      <AgentChat
        agentConfig={hrAgentConfig}
        inputPlaceholder="Ask HR anything..."
        showTimestamps
      />
    </AgenticProvider>
  )
}
```

---

## iOS Setup

### 1. Install CocoaPods dependencies

```bash
cd ios && pod install
```

### 2. Add network permissions in `ios/YourApp/Info.plist`

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <false/>
  <key>NSExceptionDomains</key>
  <dict>
    <key>api.swifterai.io</key>
    <dict>
      <key>NSExceptionAllowsInsecureHTTPLoads</key>
      <false/>
      <key>NSIncludesSubdomains</key>
      <true/>
    </dict>
  </dict>
</dict>
```

### 3. Microphone (if using voice agents)

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Required for voice agent interaction</string>
```

---

## Android Setup

### 1. Add permissions in `android/app/src/main/AndroidManifest.xml`

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<!-- Optional: for voice agents -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

### 2. Enable cleartext traffic (development only)

For development, add to your `AndroidManifest.xml` application tag:

```xml
<application
  android:usesCleartextTraffic="true"
  ...
>
```

Remove `usesCleartextTraffic` for production — the Swifter AI API uses HTTPS exclusively.

---

## Configuration Reference

### `AgenticConfig`

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `apiKey` | `string` | ✅ | — | Your platform API key |
| `appId` | `string` | ✅ | — | Your registered app ID |
| `market` | `string` | ✅ | — | Market code (e.g. `'za'`, `'ng'`, `'ke'`) |
| `department` | `string` | — | — | Department context (e.g. `'HR'`, `'CUSTOMER_SUPPORT'`) |
| `baseUrl` | `string` | — | `https://api.swifterai.io` | Override for on-premise deployments |
| `theme.primaryColor` | `string` | — | `#3b82f6` | Chat UI accent color |
| `theme.fontFamily` | `string` | — | System default | Font override |
| `theme.borderRadius` | `number` | — | `16` | Border radius for chat bubbles |

### `AgentConfig`

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `agentId` | `string` | ✅ | — | Agent ID from the platform |
| `model` | `string` | — | `gpt-4o-mini` | LLM model: `gpt-4o`, `gpt-4o-mini`, `claude-3-5-sonnet` |
| `systemPrompt` | `string` | — | — | Additional system prompt to inject |
| `language` | `string` | — | `en` | Response language code |
| `welcomeMessage` | `string` | — | — | First message shown on chat open |

---

## Markets Reference

| Code | Country | Currency | Languages | Compliance Region |
|------|---------|----------|-----------|-------------------|
| `za` | South Africa | ZAR | en, zu, af | af-south-1 |
| `ng` | Nigeria | NGN | en, pcm | eu-west-1 |
| `ke` | Kenya | KES | en, sw | eu-west-1 |
| `gh` | Ghana | GHS | en | eu-west-1 |
| `tz` | Tanzania | TZS | sw, en | eu-west-1 |
| `zm` | Zambia | ZMW | en | af-south-1 |
| `ug` | Uganda | UGX | en, sw | eu-west-1 |
| `rw` | Rwanda | RWF | en, fr, rw | eu-west-1 |
| `et` | Ethiopia | ETB | am, en | eu-west-1 |
| `eg` | Egypt | EGP | ar, en | me-south-1 |
| `ma` | Morocco | MAD | ar, fr | eu-west-1 |
| `sn` | Senegal | XOF | fr, wo | eu-west-1 |
| `ci` | Côte d'Ivoire | XOF | fr | eu-west-1 |

---

## Examples

### HR Onboarding Bot

```tsx
import { AgenticProvider, AgentChat } from '@swifter-ai/mobile-sdk'

export function HRScreen() {
  return (
    <AgenticProvider config={{ apiKey: 'ak_...', appId: 'app_...', market: 'za', department: 'HR' }}>
      <AgentChat
        agentConfig={{
          agentId: 'hr-onboarding-agent',
          model: 'gpt-4o-mini',
          language: 'en',
          welcomeMessage: 'Welcome! I can help with leave, payslips, and policies.',
        }}
        inputPlaceholder="Ask HR anything..."
      />
    </AgenticProvider>
  )
}
```

### Customer Support Bot (Swahili)

```tsx
import { AgenticProvider, AgentChat } from '@swifter-ai/mobile-sdk'

export function SupportScreen() {
  return (
    <AgenticProvider config={{ apiKey: 'ak_...', appId: 'app_...', market: 'ke' }}>
      <AgentChat
        agentConfig={{
          agentId: 'customer-support-agent',
          model: 'gpt-4o',
          language: 'sw',
          welcomeMessage: 'Habari! Ninaweza kukusaidia vipi leo?',
          systemPrompt: 'You are a helpful customer support agent. Respond in Swahili unless the user writes in English.',
        }}
        inputPlaceholder="Andika swali lako..."
        showTimestamps
      />
    </AgenticProvider>
  )
}
```

### Multi-Market App

```tsx
import { AgenticProvider, AgentChat, useMarket } from '@swifter-ai/mobile-sdk'

function MarketInfo() {
  const market = useMarket()
  if (!market) return null
  return <Text>{market.name} · {market.currency}</Text>
}

export function MultiMarketApp({ userMarket }: { userMarket: string }) {
  return (
    <AgenticProvider config={{ apiKey: 'ak_...', appId: 'app_...', market: userMarket }}>
      <MarketInfo />
      <AgentChat
        agentConfig={{ agentId: 'universal-support-agent', model: 'gpt-4o' }}
      />
    </AgenticProvider>
  )
}
```

---

## useAgent Hook (Headless)

Use `useAgent` to build your own custom UI:

```tsx
import { useAgent } from '@swifter-ai/mobile-sdk'

function CustomChat() {
  const { messages, isLoading, error, sendMessage, clearMessages } = useAgent({
    agentId: 'my-agent',
    model: 'gpt-4o-mini',
  })

  return (
    // your custom UI here
  )
}
```

---

## License

MIT © Swifter AI
