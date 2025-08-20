import { 
  createErrorResponse, 
  createSuccessResponse, 
  CommonErrors,
  generateRequestId,
  getRequestPath
} from '@/lib/error-handling'

describe('Error Handling Utilities', () => {
  describe('createErrorResponse', () => {
    it('should create error response with default values', () => {
      const response = createErrorResponse('Bad Request', 'Invalid input', 'INVALID_INPUT')
      
      expect(response.status).toBe(400)
      const data = response.json()
      expect(data.error).toBe('Bad Request')
      expect(data.message).toBe('Invalid input')
      expect(data.code).toBe('INVALID_INPUT')
      expect(data.status).toBe(400)
    })

    it('should create error response with custom status', () => {
      const response = createErrorResponse('Not Found', 'Resource not found', 'NOT_FOUND', 404)
      
      expect(response.status).toBe(404)
      const data = response.json()
      expect(data.status).toBe(404)
    })

    it('should include request ID and path when provided', () => {
      const requestId = 'test-123'
      const path = '/api/test'
      const response = createErrorResponse('Error', 'Message', 'ERROR', 500, {}, path, requestId)
      
      const data = response.json()
      expect(data.requestId).toBe(requestId)
      expect(data.path).toBe(path)
    })
  })

  describe('createSuccessResponse', () => {
    it('should create success response with data', () => {
      const testData = { id: 1, name: 'Test' }
      const response = createSuccessResponse(testData, 'Success message')
      
      expect(response.status).toBe(200)
      const data = response.json()
      expect(data.success).toBe(true)
      expect(data.data).toEqual(testData)
      expect(data.message).toBe('Success message')
    })

    it('should create success response with custom status', () => {
      const response = createSuccessResponse({}, 'Created', 201)
      
      expect(response.status).toBe(201)
      const data = response.json()
      expect(data.status).toBe(201)
    })
  })

  describe('CommonErrors', () => {
    it('should have predefined error responses', () => {
      expect(CommonErrors.BAD_REQUEST).toBeDefined()
      expect(CommonErrors.UNAUTHORIZED).toBeDefined()
      expect(CommonErrors.FORBIDDEN).toBeDefined()
      expect(CommonErrors.NOT_FOUND).toBeDefined()
      expect(CommonErrors.INTERNAL_ERROR).toBeDefined()
    })

    it('should generate error responses with path and requestId', () => {
      const path = '/api/test'
      const requestId = 'test-123'
      const error = CommonErrors.BAD_REQUEST(path, requestId)
      
      const data = error.json()
      expect(data.path).toBe(path)
      expect(data.requestId).toBe(requestId)
      expect(data.status).toBe(400)
    })
  })

  describe('generateRequestId', () => {
    it('should generate unique request IDs', () => {
      const id1 = generateRequestId()
      const id2 = generateRequestId()
      
      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
      expect(id1.length).toBeGreaterThan(0)
    })
  })

  describe('getRequestPath', () => {
    it('should extract path from request URL', () => {
      const mockRequest = {
        url: 'https://example.com/api/products?limit=10'
      } as Request
      
      const path = getRequestPath(mockRequest)
      expect(path).toBe('/api/products')
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
