import { 
  getCorsHeaders, 
  handlePreflight, 
  isOriginAllowed, 
  getCorsOrigin 
} from '@/lib/cors'

describe('CORS Utilities', () => {
  describe('getCorsHeaders', () => {
    it('should return CORS headers with allowed origin', () => {
      const origin = 'https://app.smartstore.com'
      const headers = getCorsHeaders(origin)
      
      expect(headers['Access-Control-Allow-Origin']).toBe(origin)
      expect(headers['Access-Control-Allow-Methods']).toBe('GET, POST, PUT, PATCH, DELETE, OPTIONS')
      expect(headers['Access-Control-Allow-Headers']).toBe('Content-Type, Authorization, X-Requested-With, X-API-Key, Accept, Origin, Cache-Control, Pragma')
      expect(headers['Access-Control-Allow-Credentials']).toBe('true')
    })

    it('should return default origin when no origin provided', () => {
      const headers = getCorsHeaders()
      
      expect(headers['Access-Control-Allow-Origin']).toBe('https://app.smartstore.com')
      expect(headers['Access-Control-Allow-Methods']).toBe('GET, POST, PUT, PATCH, DELETE, OPTIONS')
    })
  })

  describe('isOriginAllowed', () => {
    it('should allow valid origins', () => {
      expect(isOriginAllowed('https://app.smartstore.com')).toBe(true)
      expect(isOriginAllowed('https://admin.smartstore.com')).toBe(true)
      expect(isOriginAllowed('http://localhost:3000')).toBe(true)
    })

    it('should reject invalid origins', () => {
      expect(isOriginAllowed('https://malicious.com')).toBe(false)
      expect(isOriginAllowed('http://evil.com')).toBe(false)
      expect(isOriginAllowed('https://fake-smartstore.com')).toBe(false)
    })
  })

  describe('getCorsOrigin', () => {
    it('should extract origin from request headers', () => {
      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'origin') return 'https://app.smartstore.com'
            return null
          }
        }
      } as Request
      
      const origin = getCorsOrigin(mockRequest)
      expect(origin).toBe('https://app.smartstore.com')
    })

    it('should return undefined when no origin header', () => {
      const mockRequest = {
        headers: {
          get: (name: string) => null
        }
      } as Request
      
      const origin = getCorsOrigin(mockRequest)
      expect(origin).toBeUndefined()
    })
  })

  describe('handlePreflight', () => {
    it('should return OPTIONS response with CORS headers', () => {
      const response = handlePreflight()
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://app.smartstore.com')
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PUT, PATCH, DELETE, OPTIONS')
    })
  })
})
