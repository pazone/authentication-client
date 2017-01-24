const test = require('tape');
const sinon = require('sinon');
const User = require('../../../src/models/user');
const Client = require('../../../src/models/client');
const Store = require('../../../src/services/store');
const Consumer = require('../../../src/services/consumer');
const API = require('../../../src/api').Sandbox;

const sandbox = sinon.sandbox.create();

/**
 * Instances
 */

function getUserInstances() {
  const client = new Client('id', 'secret');
  const api = new API();
  const store = new Store('namespace');
  const consumer = new Consumer(client, api);
  const user = new User(store, consumer);
  return {
    client,
    api,
    user,
    store,
    consumer,
  };
}

/**
 * Mocks
 */
const UserMocks = require('../../mocks/user');

/**
 * User.constructor(options)
 */

test('User.constructor(options) should throw an error for', (t) => {
  t.test('missing `store`', (assert) => {
    assert.plan(1);
    const instances = getUserInstances();
    try {
      new User(Object(), instances.consumer);
    } catch (err) {
      assert.equals(err.message, '`store` should be instance of Store');
    }
  });

  t.test('missing `consumer`', (assert) => {
    assert.plan(1);
    const instances = getUserInstances();
    try {
      new User(instances.store, Object());
    } catch (err) {
      assert.equals(err.message, '`consumer` should be instance of Consumer');
    }
  });
});

/**
 * User.id
 */

test('User.id should be read-only', (assert) => {
  assert.plan(2);
  const instances = getUserInstances();
  assert.equals(instances.user.id, undefined);
  instances.user.id = 'id';
  assert.equals(instances.user.id, undefined);
});

/**
 * User.publisherId
 */

test('User.publisherId should be read-only', (assert) => {
  assert.plan(2);
  const instances = getUserInstances();
  assert.equals(instances.user.publisherId, undefined);
  instances.user.publisherId = 'publisherId';
  assert.equals(instances.user.publisherId, undefined);
});

/**
 * User.email
 */

test('User.email should be read-write', (assert) => {
  assert.plan(2);
  const instances = getUserInstances();
  instances.user.email = 'john.doe@mail.com';
  assert.equals(instances.user.email, 'john.doe@mail.com');
  instances.user.email = null;
  assert.equals(instances.user.email, 'john.doe@mail.com');
});

/**
 * User.firstName
 */

test('User.firstName should be read-write', (assert) => {
  assert.plan(2);
  const instances = getUserInstances();
  instances.user.firstName = 'Doe';
  assert.equals(instances.user.firstName, 'Doe');
  instances.user.firstName = null;
  assert.equals(instances.user.firstName, 'Doe');
});

/**
 * User.lastName
 */

test('User.lastName should be read-write', (assert) => {
  assert.plan(2);
  const instances = getUserInstances();
  instances.user.lastName = 'Doe';
  assert.equals(instances.user.lastName, 'Doe');
  instances.user.lastName = null;
  assert.equals(instances.user.lastName, 'Doe');
});

/**
 * User.bearer
 */

test('User.bearer should be read-write', (assert) => {
  assert.plan(3);
  const instances = getUserInstances();
  const storeSetStub = sandbox.stub(instances.store, 'set', () => {});
  sandbox.stub(instances.store, 'get', () => 'mock_access_token');
  // Assert Store.get()
  assert.equals(instances.user.bearer, 'mock_access_token');
  instances.user.bearer = 'new_access_token';
  // Assert Store.set()
  assert.deepEquals(storeSetStub.getCall(0).args, ['access_token', 'new_access_token']);
  instances.user.bearer = null;
  // Assert Store.set() with no value
  assert.deepEquals(storeSetStub.callCount, 1);
  sandbox.restore();
});


/**
 * User.isAuthenticated
 */

test('User.isAuthenticated should return', (t) => {
  t.test('true for User with token', (assert) => {
    assert.plan(1);
    const instances = getUserInstances();
    sandbox.stub(instances.store, 'get', () => 'access_token');
    assert.equals(instances.user.isAuthenticated, true);
    sandbox.restore();
  });
  t.test('false for User without token', (assert) => {
    assert.plan(1);
    const instances = getUserInstances();
    sandbox.stub(instances.store, 'get', () => undefined);
    assert.equals(instances.user.isAuthenticated, false);
    sandbox.restore();
  });
});

/**
 * User.authenticate(username, password)
 */

test('User.authenticate(username, password) should throw an error for', (t) => {
  t.test('missing `username`', (assert) => {
    assert.plan(1);
    const instances = getUserInstances();
    try {
      instances.user.authenticate(null, 'password');
    } catch (err) {
      assert.equals(err.message, 'Missing `username`');
    }
  });

  t.test('missing `password`', (assert) => {
    assert.plan(1);
    const instances = getUserInstances();
    try {
      instances.user.authenticate('username', null);
    } catch (err) {
      assert.equals(err.message, 'Missing `password`');
    }
  });
});

test('User.authenticate(username, password) should store user and token on success', (assert) => {
  assert.plan(7);
  const instances = getUserInstances();
  const storeSetSpy = sandbox.spy();
  const retrieveUserStub = sandbox.stub();
  const retrieveTokenStub = sandbox.stub();
  retrieveUserStub.returns({
    id: '44d2c8e0-762b-4fa5-8571-097c81c3130d',
    publisher_id: '55f5c8e0-762b-4fa5-8571-197c8183130a',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@mail.com',
  });
  retrieveTokenStub.returns(Promise.resolve({
    refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    access_token: 'rkdkJHVBdCjLIIjsIK4NalauxPP8uo5hY8tTN7',
  }));
  instances.store.set = storeSetSpy;
  instances.consumer.retrieveUser = retrieveUserStub;
  instances.consumer.retrieveToken = retrieveTokenStub;
  instances.user.authenticate('username', 'password').then(() => {
    assert.deepEquals(storeSetSpy.getCall(0).args, ['access_token', 'rkdkJHVBdCjLIIjsIK4NalauxPP8uo5hY8tTN7']);
    assert.deepEquals(storeSetSpy.getCall(1).args, ['refresh_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9']);
    assert.equals(instances.user.id, '44d2c8e0-762b-4fa5-8571-097c81c3130d');
    assert.equals(instances.user.publisherId, '55f5c8e0-762b-4fa5-8571-197c8183130a');
    assert.equals(instances.user.email, 'john.doe@mail.com');
    assert.equals(instances.user.firstName, 'John');
    assert.equals(instances.user.lastName, 'Doe');
  });
  sandbox.restore();
});

/**
 * User.create(email, password, firstName, lastName)
 */

test('User.create(email, password, firstName, lastName) should throw an error', (t) => {
  t.test('for missing `email`', (assert) => {
    assert.plan(1);
    const instances = getUserInstances();
    try {
      instances.user.create(null, 'password', 'firstName', 'lastName');
    } catch (err) {
      assert.equals(err.message, 'Missing `email`');
    }
  });

  t.test('for missing `password`', (assert) => {
    assert.plan(1);
    const instances = getUserInstances();
    try {
      instances.user.create('john.doe@mail.com', null, 'firstName', 'lastName');
    } catch (err) {
      assert.equals(err.message, 'Missing `password`');
    }
  });
});

test('User.create(email, password, firstName, lastName) should reject invalid password', (assert) => {
  assert.plan(1);
  const instances = getUserInstances();
  instances.user.create('john.doe@mail.com', 'password').catch((err) => {
    assert.equals(err.message, 'Password must contain both numbers and characters');
  });
});

test('User.create(email, password, firstName, lastName) should set User data on success', (assert) => {
  assert.plan(5);
  const response = Object.assign(UserMocks.User, {});
  const instances = getUserInstances();
  sandbox.stub(instances.consumer, 'createUser', () => Promise.resolve(response));
  instances.user.create('john.doe@mail.com', 'password123456', 'firstName', 'lastName').then(() => {
    assert.equals(instances.user.id, response.id);
    assert.equals(instances.user.publisherId, response.publisher_id);
    assert.equals(instances.user.firstName, response.first_name);
    assert.equals(instances.user.lastName, response.last_name);
    assert.equals(instances.user.email, response.email);
  });
  sandbox.restore();
});


/**
 * User.save()
 */

test('User.save() should not allow saving an unauthenticated User', (assert) => {
  assert.plan(1);
  const instances = getUserInstances();
  instances.user.email = 'john.doe@mail.com';
  instances.user.save().catch((err) => {
    assert.equals(err.message, 'Cannot save a non-existent User');
  });
});

test('User.save() should update User with new data', (assert) => {
  assert.plan(1);
  const instances = getUserInstances();
  sandbox.stub(instances.consumer, 'createUser', () => Promise.resolve(Object.assign(UserMocks.User, {})));
  instances.user.create('john.doe@mail.com', 'password123456').then(() => {
    instances.user.email = 'john.doe@mail.com';
    instances.user.lastName = 'John';
    instances.user.firstName = 'Doe';
    sandbox.stub(instances.store, 'get', () => 'bearer');
    const updateUserStub = sandbox.stub(instances.consumer, 'updateUser', () => Promise.resolve());
    instances.user.save().then(() => {
      assert.deepEquals(updateUserStub.getCall(0).args, ['44d2c8e0-762b-4fa5-8571-097c81c3130d', 'bearer', { email: 'john.doe@mail.com', firstName: 'Doe', lastName: 'John' }]);
    });
  });
  sandbox.restore();
});
