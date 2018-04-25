'use strict';

const lbe2e = require('lb-declarative-e2e-test');

const server = require('../../server/server'),
  CoffeeShopModel = server.models.CoffeeShop,
  testHelper = require('./_testHelper'),
  coffeeShopFactory = testHelper.factories.coffeeShop;


describe('CoffeeShop', () => {

  const profiles = {
      admin: {
        email: testHelper.access.admin.profile.email,
        password: testHelper.access.admin.profile.password
      },
      user: {
        email: testHelper.access.user.profile.email,
        password: testHelper.access.user.profile.password
      }
    },
    coffeeShopApiUrl = '/api/CoffeeShops/';

  let shops;

  const e2eTestsSuite = {
    'CoffeeShops E2E Tests': {
      before: () => Promise.all([
        testHelper.access.admin.create(server),
        testHelper.access.user.create(server)
      ]),
      beforeEach: () => {
        const models = Array(5).fill('').map((_, index) => coffeeShopFactory(index));
        return CoffeeShopModel.create(models)
          .then(res => {
            shops = res.map(model => model.toJSON());
          });
      },
      afterEach: () => CoffeeShopModel.destroyAll(),
      after: () => server.models.AppUser.destroyAll(),
      tests: {
        'Create access': {
          tests: [
            {
              name: 'everyone CANNOT create',
              verb: 'post',
              url: coffeeShopApiUrl,
              body: coffeeShopFactory(),
              expect: 401
            },
            {
              name: 'user CANNOT create',
              verb: 'post',
              auth: profiles.user,
              url: coffeeShopApiUrl,
              body: coffeeShopFactory(),
              expect: 401
            },
            {
              name: 'admin CAN create',
              verb: 'post',
              auth: profiles.admin,
              url: coffeeShopApiUrl,
              body: coffeeShopFactory(),
              expect: 200
            }
          ]
        },
        'Read access': {
          tests: [
            {
              name: 'everyone CAN read (one)',
              verb: 'get',
              url: () => coffeeShopApiUrl + shops[0].id,
              expect: 200
            },
            {
              name: 'everyone CAN read All',
              verb: 'get',
              url: coffeeShopApiUrl,
              expect: 200
            }
          ]
        },
        'Update access': {
          tests: [
            {
              name: 'everyone CANNOT update',
              verb: 'put',
              url: () => coffeeShopApiUrl + shops[0].id,
              body: () => ({
                ...shops[0],
                name: `${shops[0].name} - updated`
              }),
              expect: 401
            },
            {
              name: 'user CANNOT update',
              verb: 'put',
              auth: profiles.user,
              url: () => coffeeShopApiUrl + shops[0].id,
              body: () => ({
                ...shops[0],
                name: `${shops[0].name} - updated`
              }),
              expect: 401
            },
            {
              name: 'admin CAN update',
              verb: 'put',
              auth: profiles.admin,
              url: () => coffeeShopApiUrl + shops[0].id,
              body: () => ({
                ...shops[0],
                name: `${shops[0].name} - updated`
              }),
              expect: 200
            }
          ]
        },
        'Delete access': {
          tests: [
            {
              name: 'everyone CANNOT delete',
              verb: 'delete',
              url: () => coffeeShopApiUrl + shops[0].id,
              expect: 401
            },
            {
              name: 'user CANNOT delete',
              verb: 'delete',
              auth: profiles.user,
              url: () => coffeeShopApiUrl + shops[0].id,
              expect: 401
            },
            {
              name: 'admin CAN delete',
              verb: 'delete',
              auth: profiles.admin,
              url: () => coffeeShopApiUrl + shops[0].id,
              expect: 200
            }
          ]
        }
      }
    }
  };

  const testConfig = {
    // Defines a custom login endpoint as the User model is overridden
    auth: {url: '/api/AppUsers/login'}
  };

  lbe2e(server, testConfig, e2eTestsSuite);

});


