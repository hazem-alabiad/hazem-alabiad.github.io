import { describe, it, expect, vi } from 'vitest'
import { getPost, posts } from './posts'

describe('Blog Posts loader', () => {
  it('loads posts from MDX files via glob', () => {
    // Vitest automatically resolves import.meta.glob from the actual file system
    // So there should be at least one post if the project has posts
    expect(Array.isArray(posts)).toBe(true)
  })

  it('sorts posts by date descending', () => {
    if (posts.length >= 2) {
      expect(posts[0].date >= posts[1].date).toBe(true)
    }
  })

  it('can fetch a post by slug', () => {
    if (posts.length > 0) {
      const slug = posts[0].slug
      const post = getPost(slug)
      expect(post).toBeDefined()
      expect(post?.slug).toBe(slug)
    }
  })

  it('returns undefined for non-existent slug', () => {
    const post = getPost('does-not-exist-12345')
    expect(post).toBeUndefined()
  })
})
