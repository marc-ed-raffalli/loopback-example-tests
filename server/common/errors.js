'use strict';

const codeNames = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found'
};

module.exports = {
  make: (code, message) => {
    const err = new Error(message || codeNames[code] || 'An error occurred!');
    err.statusCode = code;
    return err;
  }
};
