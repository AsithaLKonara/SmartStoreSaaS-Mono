import request from 'supertest'
import { createServer } from 'http'
import { NextRequest } from 'next/server'
import { GET as healthHandler } from '@/app/api/health/route'
import { GET as readinessHandler } from '@/app/api/readyz/route'

// Mock Next.js server for testing
function createTestServer(handler: any) {
  return createServer(async (req, res) => {
    try {
      const nextReq = new NextRequest(req.url!, {
        method: req.method,
        headers: req.headers as any,
      })
      
      const response = await handler(nextReq)
      const data = await response.json()
      
      res.writeHead(response.status, response.headers as any)
      res.end(JSON.stringify(data))
    } catch (error) {
      res.writeHead(500)
      res.end(JSON.stringify({ error: 'Internal Server Error' }))
    }
  })
}

describe('API Integration Tests', () => {
  let healthServer: any
  let readinessServer: any

  beforeAll(() => {
    healthServer = createTestServer(healthHandler)
    readinessServer = createTestServer(readinessHandler)
  })

  afterAll((done) => {
    healthServer.close(done)
    readinessServer.close(done)
  })

  describe('Health Check API', () => {
    it('should return 200 and health status', async () => {
      const response = await request(healthServer)
        .get('/')
        .expect(200)

      expect(response.body).toHaveProperty('status')
      expect(response.body.status).toBe('healthy')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('uptime')
      expect(response.body).toHaveProperty('environment')
      expect(response.body).toHaveProperty('version')
      expect(response.body).toHaveProperty('services')
    })

    it('should include required security headers', async () => {
      const response = await request(healthServer)
        .get('/')
        .expect(200)

      expect(response.headers).toHaveProperty('x-frame-options')
      expect(response.headers['x-frame-options']).toBe('DENY')
    })
  })

  describe('Readiness Check API', () => {
    it('should return 503 in development environment', async () => {
      const response = await request(readinessServer)
        .get('/')
        .expect(503)

      expect(response.body).toHaveProperty('status')
      expect(response.body.status).toBe('not_ready')
      expect(response.body).toHaveProperty('services')
      expect(response.body).toHaveProperty('checks')
    })

    it('should include required security headers', async () => {
      const response = await request(readinessServer)
        .get('/')
        .expect(503)

      expect(response.headers).toHaveProperty('x-frame-options')
      expect(response.headers['x-frame-options']).toBe('DENY')
    })
  })
})
