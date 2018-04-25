'use strict';

const expect = require('chai').expect,
  lbe2e = require('lb-declarative-e2e-test');

const server = require('../../server/server'),
  testHelper = require('./_testHelper'),
  AppUserModel = server.models.AppUser,
  appUserFactory = testHelper.factories.appUser;


describe('AppUser', () => {

  let userModels;

  const users = Array(2).fill('').map(() => appUserFactory(undefined, 'user')),
    profiles = {
      admin: {
        email: testHelper.access.admin.profile.email,
        password: testHelper.access.admin.profile.password
      },
      user: {
        email: users[0].email,
        password: users[0].password
      }
    },
    appUserApiUrl = '/api/AppUsers/',
    getUser0Url = () => appUserApiUrl + userModels[0].id,

    e2eTestsSuite = {
      'AppUsers E2E Tests': {
        beforeEach: () => {
          return Promise.all([
            testHelper.access.admin.create(server),
            AppUserModel.create(users)
              .then(res => {
                userModels = res.map(model => ({
                  id: model.id,
                  email: model.email,
                  role: model.role,
                  favoriteDrink: model.favoriteDrink
                }));
              })
          ]);
        },
        afterEach: () => AppUserModel.destroyAll(),
        tests: {
          'Create access': {
            tests: [
              {
                name: 'everyone CAN create "role: user" user',
                verb: 'post',
                url: appUserApiUrl,
                body: appUserFactory(undefined, 'user'),
                expect: 200
              },
              {
                name: 'everyone CANNOT create "role: admin" user',
                verb: 'post',
                url: appUserApiUrl,
                body: appUserFactory(undefined, 'admin'),
                expect: 403
              },
              {
                name: 'user CANNOT create "role: admin" user',
                verb: 'post',
                url: appUserApiUrl,
                auth: profiles.user,
                body: appUserFactory(undefined, 'admin'),
                expect: 403
              },
              {
                name: 'admin CAN create "role: user" user',
                verb: 'post',
                url: appUserApiUrl,
                auth: profiles.admin,
                body: appUserFactory(undefined, 'user'),
                expect: 200
              },
              {
                name: 'admin CAN create "role: admin" user',
                verb: 'post',
                url: appUserApiUrl,
                auth: profiles.admin,
                body: appUserFactory(undefined, 'admin'),
                expect: 200
              }
            ]
          },
          'Read access': {
            tests: [
              {
                name: 'everyone CANNOT read user details',
                verb: 'get',
                url: getUser0Url,
                expect: 401
              },
              {
                name: 'everyone CANNOT read user list',
                verb: 'get',
                url: appUserApiUrl,
                expect: 401
              },

              {
                name: 'user CANNOT read user details',
                verb: 'get',
                url: () => appUserApiUrl + userModels[1].id,
                auth: profiles.user, // user 0
                expect: 401
              },
              {
                name: 'user CANNOT read user list',
                verb: 'get',
                url: appUserApiUrl,
                auth: profiles.user,
                expect: 401
              },
              {
                name: 'user CAN read his OWN details',
                verb: 'get',
                url: getUser0Url,
                auth: profiles.user,
                expect: 200
              },
              {
                name: 'user\'s password is NOT sent to client',
                verb: 'get',
                url: getUser0Url,
                auth: [profiles.user, profiles.admin],
                expect: res => {
                  expect(res.body.password).to.be.undefined;
                }
              },

              {
                name: 'admin CAN read user details',
                verb: 'get',
                url: getUser0Url,
                auth: profiles.admin,
                expect: 200
              },
              {
                name: 'admin CAN read user list',
                verb: 'get',
                url: appUserApiUrl,
                auth: profiles.admin,
                expect: 200
              }
            ]
          },
          'Update access': {
            tests: [
              {
                name: 'everyone CANNOT update user\'s details',
                verb: 'patch',
                url: getUser0Url,
                body: {favoriteDrink: 'coffee'},
                expect: 401
              },
              {
                name: 'user CANNOT update user\'s details',
                verb: 'patch',
                url: () => appUserApiUrl + userModels[1].id,
                auth: profiles.user, // user 0
                body: {favoriteDrink: 'coffee'},
                expect: 401
              },
              {
                name: 'user CAN update his OWN details',
                verb: 'patch',
                url: getUser0Url,
                auth: profiles.user,
                body: {favoriteDrink: 'coffee'},
                expect: 200
              },
              {
                name: 'user CANNOT update his OWN details to "role: admin"',
                verb: 'patch',
                url: getUser0Url,
                auth: profiles.user,
                body: {role: 'admin'},
                expect: 403
              },

              {
                name: 'admin CAN update user\'s details',
                verb: 'patch',
                url: getUser0Url,
                auth: profiles.admin,
                body: {favoriteDrink: 'coffee'},
                expect: 200
              },
              {
                name: 'admin CANNOT update user\'s password',
                verb: 'patch',
                url: getUser0Url,
                auth: profiles.admin,
                body: {password: 'someEasyOnes'},
                expect: 403
              },
              {
                name: 'admin CAN update user\'s details to "role: admin"',
                verb: 'patch',
                url: getUser0Url,
                auth: profiles.admin,
                body: {role: 'admin'},
                expect: 200
              }
            ]
          },
          'login access': {
            tests: [
              {
                name: 'everyone CAN login',
                verb: 'post',
                url: appUserApiUrl + 'login',
                body: users[0],
                expect: 200
              },
              {
                name: 'everyone CAN logout',
                verb: 'post',
                auth: users[0],
                url: appUserApiUrl + 'logout',
                expect: 204
              }
            ]
          }
        }
      }
    },
    testConfig = {
      // Defines a custom login endpoint as the User model is overridden
      auth: {url: '/api/AppUsers/login'},
      error: err => {
        console.error(err);
      }
    };

  lbe2e(server, testConfig, e2eTestsSuite);

});


