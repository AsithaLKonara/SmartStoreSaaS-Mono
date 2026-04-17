import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SmartStore SaaS API Documention',
      version: '1.2.2',
      description: 'API Documentation for the SmartStore SaaS platform. Features multi-tenant ERP, logistics, and AI insights.',
      contact: {
        name: 'SmartStore Dev Support',
        url: 'https://smartstore-saas.com/support',
        email: 'dev@smartstore-saas.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./src/app/api/**/*.ts', './src/lib/docs/swagger-schemas.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
