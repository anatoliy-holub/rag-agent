export const swaggerDocument = {
  openapi: '3.0.0',
  info: { title: 'RAG Ask API', version: '1.0.0' },
  servers: [{ url: 'http://localhost:3000', description: 'Local' }],
  paths: {
    '/ask': {
      post: {
        summary: 'Ask a question',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['question'],
                properties: { question: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Answer',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    answer: { type: 'string' },
                    contextUsed: { type: 'string', nullable: true },
                    score: { type: 'number' },
                  },
                },
              },
            },
          },
          400: { description: 'Bad request' },
          500: { description: 'Server error' },
        },
      },
    },
  },
};
