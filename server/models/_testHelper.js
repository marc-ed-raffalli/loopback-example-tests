'use strict';

const roleManager = require('../common/role-manager');

let lastCsId = 0,
  lastUserId = 0;

function coffeeShopFactory(id) {
  id = id ? id : lastCsId++;
  return {
    name: `Coffee shop ${id}`,
    city: `City ${id}`
  };
}

function appUserFactory(id, role) {
  id = id ? id : lastUserId++;

  const user = {
    email: `${role ? role : 'name'}-${id}@coffeeshop.com`,
    password: `user-${id}-pwd`
  };

  if (role) {
    user.role = role;
  }

  return user;
}

function buildMethods(profile) {
  return {
    profile,
    create: app => {
      return app.models.AppUser.create({
        email: profile.email,
        password: profile.password
      })
        .then(user => {
          // restricted the admin creation in app:
          // admin role cannot be set without a valid admin session
          if (profile.role === 'admin') {
            // need to manually set the role here
            return roleManager.setUserRole(app, user.id, 'admin', true)
              .then(() => user); // force the return of the user
          }

          return user;
        });
    },
    login: app => app.models.AppUser.login(profile)
  };
}

module.exports = {
  factories: {
    appUser: appUserFactory,
    coffeeShop: coffeeShopFactory
  },
  access: {
    admin: buildMethods(appUserFactory(undefined, 'admin')),
    user: buildMethods(appUserFactory(undefined, 'user'))
  }
};
