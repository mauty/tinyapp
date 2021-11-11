const { assert } = require('chai');

const { getUserByEmail } = require('../helpers/helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert.strictEqual(user, expectedUserID, 'emails match')
  });
  it('should return null with no email', function() {
    const user = getUserByEmail("", testUsers)
    const expectedUserID = "userRandomID";
    assert.strictEqual(user, null, 'emails match')
  });
});