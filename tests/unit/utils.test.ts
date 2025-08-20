import { generateRequestId, getRequestPath } from '@/lib/error-handling'

describe('Utility Functions', () => {
  describe('generateRequestId', () => {
    it('should generate a unique request ID', () => {
      const id1 = generateRequestId()
      const id2 = generateRequestId()
      
      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
      expect(id1.length).toBeGreaterThan(0)
    })

    it('should generate different IDs on each call', () => {
      const ids = new Set()
      for (let i = 0; i < 100; i++) {
        ids.add(generateRequestId())
      }
      expect(ids.size).toBe(100)
    })
  })

  describe('getRequestPath', () => {
    it('should extract path from Request object', () => {
      const mockRequest = {
        url: 'https://example.com/api/products?limit=10'
      } as Request
      
      const path = getRequestPath(mockRequest)
      expect(path).toBe('/api/products')
    })

    it('should handle requests without query parameters', () => {
      const mockRequest = {
        url: 'https://example.com/api/health'
      } as Request
      
      const path = getRequestPath(mockRequest)
      expect(path).toBe('/api/health')
    })

    it('should handle root path', () => {
      const mockRequest = {
        url: 'https://example.com/'
      } as Request
      
      const path = getRequestPath(mockRequest)
      expect(path).toBe('/')
    })
  })
})
