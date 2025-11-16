import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Task Management System API',
    version: '1.0.0',
    description: ''
  },
  servers: [
    {
      url: process.env.API_URL || 'http://localhost:3000'
    }
  ],
  tags: [
    { name: 'Authentication' },
    { name: 'Tasks' },
    { name: 'Comments' },
    { name: 'Files' },
    { name: 'Analytics' }
  ]
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);

