import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://cryptoreference.io'
  const lastModified = new Date()

  return [
    // =========================
    // Root
    // =========================
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
    },

    // =========================
    // Exchanges (CEX)
    // =========================
    {
      url: `${baseUrl}/exchanges`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/exchanges/binance`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/exchanges/okx`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/exchanges/gate`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },

    // =========================
    // Swap Service
    // =========================
    {
      url: `${baseUrl}/swap`,
      lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
    },

    // =========================
    // DEX Hub
    // =========================
    {
      url: `${baseUrl}/dex`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },

    // =========================
    // DEX Entities
    // =========================
    {
      url: `${baseUrl}/dex/asterdex`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/dex/hyperliquid`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/dex/hibachi`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/dex/lighter`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },

    // =========================
    // Comparisons
    // =========================
    {
      url: `${baseUrl}/dex/compare`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },

    // =========================
    // Cards / Financial Products
    // =========================
    {
      url: `${baseUrl}/cards/etherfi`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ]
}