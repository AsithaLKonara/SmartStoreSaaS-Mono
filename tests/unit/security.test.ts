import { 
  applySecurityHeaders, 
  getSecurityHeaders, 
  validateOrigin 
} from '@/lib/security'

describe('Security Utilities', () => {
  describe('getSecurityHeaders', () => {
    it('should return security headers for API context', () => {
      const headers = getSecurityHeaders('api')
      
      expect(headers['X-Frame-Options']).toBe('DENY')
      expect(headers['X-Content-Type-Options']).toBe('nosniff')
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
      expect(headers['Strict-Transport-Security']).toBe('max-age=63072000; includeSubDomains; preload')
    })

    it('should return security headers for page context', () => {
      const headers = getSecurityHeaders('page')
      
      expect(headers['X-Frame-Options']).toBe('DENY')
      expect(headers['X-Content-Type-Options']).toBe('nosniff')
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    })

    it('should return security headers for admin context', () => {
      const headers = getSecurityHeaders('admin')
      
      expect(headers['X-Frame-Options']).toBe('DENY')
      expect(headers['X-Content-Type-Options']).toBe('nosniff')
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    })
  })

  describe('validateOrigin', () => {
    it('should validate legitimate origins', () => {
      const mockRequest = new Request('https://app.smartstore.com', {
        headers: {
          'origin': 'https://app.smartstore.com',
          'host': 'app.smartstore.com'
        }
      })
      expect(validateOrigin(mockRequest)).toBe(true)
    })

    it('should reject suspicious origins', () => {
      const mockRequest = new Request('https://malicious.com', {
        headers: {
          'origin': 'https://malicious.com',
          'host': 'smartstore.com'
        }
      })
      expect(validateOrigin(mockRequest)).toBe(false)
    })
  })

  describe('applySecurityHeaders', () => {
    it('should apply security headers to response', () => {
      const mockResponse = new Response('test', { status: 200 })
      const securedResponse = applySecurityHeaders(mockResponse)
      
      expect(securedResponse.headers.get('X-Frame-Options')).toBe('DENY')
      expect(securedResponse.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(securedResponse.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    })
  })
})
