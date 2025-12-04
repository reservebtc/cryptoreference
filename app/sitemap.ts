import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://cryptoreference.io'
  const lastModified = new Date()
  
  return [
    // Homepage
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    
    // Exchanges Hub
    {
      url: `${baseUrl}/exchanges`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    
    // CEX Pages
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

    // Token Swap Service
    {
      url: `${baseUrl}/swap`,
      lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    
    // DEX Hub
    {
      url: `${baseUrl}/dex`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    
    // DEX Pages
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
    
    // Comparison
    {
      url: `${baseUrl}/dex/compare`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    
    // Crypto Cards
    {
      url: `${baseUrl}/cards/etherfi`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    
    // News
    {
      url: `${baseUrl}/news`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/news/archive`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]
}