// https://eslint.org/docs/user-guide/configuring

module.exports = {
  "plugins": [
    "vue"
  ],
  "rules": {
    // allow async-await
    'generator-star-spacing': 'off',
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    "arrow-body-style": [0],
    "arrow-parens": 0,
    "class-methods-use-this": 0,
    "comma-dangle": 0,
    "consistent-return": [0], //added to ease of migration
    "func-names": [0], //added to ease of migration
    "import/extensions": [0],
    "import/no-extraneous-dependencies": [0],
    "import/no-unresolved": [0],
    "import/prefer-default-export": [0],
    "indent": [0],
    "jsx-a11y/href-no-hash": "off",
    "max-len": [0],
    "no-confusing-arrow": [0],
    "no-mixed-operators": 0,
    "no-param-reassign": 0,
    "no-plusplus": 0,
    "no-return-assign": [0],
    "no-shadow": [0], //added to ease of migration
    "no-underscore-dangle": 0,
    "no-use-before-define": [0], //added to ease of migration
    "object-curly-spacing": [0],
    "prefer-arrow-callback": [0], //added to ease of migration
    "prefer-template": [0], //added to ease of migration
    "quotes": [2, "double", "avoid-escape"],
    "react/jsx-filename-extension": 0,
    "react/jsx-indent": 0,
    "react/jsx-wrap-multilines": 0,
    "react/no-array-index-key": 0,
    "react/prop-types": 0,
    "react/sort-comp": 0,
    "space-before-function-paren": 0,
    "spaced-comment": [0]
  },
  "globals": {
    "cordova": true,
    "fetch": true,
    "google": true
  },
  "env": {
    "browser": true,
    "mocha": true,
    "jest": true
  },
  "parser": "babel-eslint",
  "parserOptions": {
    "ecmaVersion": 7,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true,
    }
  }
}
