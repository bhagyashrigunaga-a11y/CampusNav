/**
 * CampusNav - AWS Lambda Entry Point
 * Implements Section III.C (Serverless Layer) from the research paper.
 * Routes API Gateway events to Express application handlers.
 */

const app = require('./server');

// Lightweight serverless adapter compatible with AWS API Gateway v1 (REST) & v2 (HTTP)
exports.handler = async (event, context) => {
  // If running inside standard AWS Lambda with @vendia/serverless-express:
  // const serverlessExpress = require('@vendia/serverless-express');
  // return serverlessExpress({ app })(event, context);

  // Standalone lightweight handler for serverless search & notifications:
  const path = event.rawPath || event.path || '/';
  const method = (event.requestContext?.http?.method || event.httpMethod || 'GET').toUpperCase();
  const query = event.queryStringParameters || {};
  const body = event.body ? (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) : {};

  console.log(`[AWS Lambda Invocation] ${method} ${path}`);

  // Handle serverless lightweight search request
  if (path.includes('/search')) {
    const db = require('./config/db');
    const nodes = await db.getNodes();
    const q = (query.q || '').toLowerCase().trim();
    const results = q ? nodes.filter(n => n.name.toLowerCase().includes(q) || (n.facility_type || '').includes(q)) : nodes;
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        serverless: true,
        source: 'AWS Lambda',
        results
      })
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      status: 'AWS Lambda Function Executed Successfully',
      runtime: 'Node.js 20.x on AWS Lambda',
      path,
      method
    })
  };
};
