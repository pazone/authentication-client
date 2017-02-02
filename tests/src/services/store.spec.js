const test = require('tape');
const sinon = require('sinon');
const LocalStorage = require('store');
const Store = require('../../../src/services/store');

const store = new Store('domain');
const sandbox = sinon.sandbox.create();

/**
 * Store.constructor(options)
 */

test('Store.constructor(options) should throw an error for missing `domain`', (assert) => {
  assert.plan(1);
  try {
    new Store();
  } catch (err) {
    assert.equals(err.message, 'Missing `domain`');
  }
});

/**
 * Store.set(key, value)
 */

test('Store.set(key, value) should call LocalStorage.set(key, value) with normalized key', (assert) => {
  assert.plan(1);
  const setSpy = sandbox.spy(LocalStorage, 'set');
  store.set('key', 'value');
  assert.deepEquals(setSpy.getCall(0).args, ['domain_key', 'value']);
  sandbox.restore();
});

/**
 * Store.get(key)
 */

test('Store.get(key) should call LocalStorage.get(key) with normalized key', (assert) => {
  assert.plan(1);
  const getSpy = sandbox.spy(LocalStorage, 'get');
  store.get('key');
  assert.deepEquals(getSpy.getCall(0).args, ['domain_key']);
  sandbox.restore();
});

/**
 * Store.remove(key)
 */

test('Store.remove(key) should call LocalStorage.remove(key) with normalized key', (assert) => {
  assert.plan(1);
  const removeSpy = sandbox.spy(LocalStorage, 'remove');
  store.remove('key');
  assert.deepEquals(removeSpy.getCall(0).args, ['domain_key']);
  sandbox.restore();
});
