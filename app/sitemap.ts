import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sewn-eight.vercel.app'

  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/experts`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // 전문가 페이지들
  let expertPages: MetadataRoute.Sitemap = []
  try {
    const { data: experts } = await supabase
      .from('expert_profiles')
      .select('id, updated_at')
      .limit(100)

    if (experts) {
      expertPages = experts.map((expert) => ({
        url: `${baseUrl}/experts/${expert.id}`,
        lastModified: new Date(expert.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    }
  } catch (error) {
    console.error('Error fetching experts for sitemap:', error)
  }

  // 프로젝트 페이지들
  let projectPages: MetadataRoute.Sitemap = []
  try {
    const { data: projects } = await supabase
      .from('projects')
      .select('id, updated_at')
      .eq('status', 'open')
      .limit(100)

    if (projects) {
      projectPages = projects.map((project) => ({
        url: `${baseUrl}/projects/${project.id}`,
        lastModified: new Date(project.updated_at),
        changeFrequency: 'daily' as const,
        priority: 0.6,
      }))
    }
  } catch (error) {
    console.error('Error fetching projects for sitemap:', error)
  }

  return [...staticPages, ...expertPages, ...projectPages]
}
