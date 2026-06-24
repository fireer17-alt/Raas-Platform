let pubsub = null;

try {
  const PubSub = require('@google-cloud/pubsub');
  pubsub = new PubSub.PubSub({ projectId: process.env.GOOGLE_CLOUD_PROJECT });
} catch (error) {
  console.warn('GCP Pub/Sub initialization skipped (for development):', error.message);
}

module.exports = { pubsub };
