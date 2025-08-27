// Mock Redis client for development
const mockClient = {
  connect: async () => {
    console.log('⚠️  Using mock Redis client');
    return Promise.resolve();
  },
  on: () => {},
  get: async () => null,
  set: async () => 'OK',
  del: async () => 1,
  quit: async () => 'OK'
};

console.log('⚠️  Using mock Redis client for development');

module.exports = mockClient;
