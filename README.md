# trailpack-design-first

[![Gitter][gitter-image]][gitter-url]
[![NPM version][npm-image]][npm-url]
[![Build status][ci-image]][ci-url]
[![Dependency Status][daviddm-image]][daviddm-url]
[![Code Climate][codeclimate-image]][codeclimate-url]

Design first architecture Trailpack. This trailpack allow you to map routes/validations from your swagger definition file 
to your controllers. Like this you are sure what's on your definition is really what is implemented.

## What are Footprints?

Footprints automatically generate easy-to-use RESTful endpoints for your models.

## Install

```sh
$ npm install --save trailpack-design-first
```

## Configure

```js
// config/main.js
module.exports = {
  packs: [
    // ... other trailpacks
    require('trailpack-design-first')
  ]
}
```

```js
// config/swagger.js
module.exports = {
  swaggerDefinition: './swagger/definition.yaml', // or an array of swagger definition
  swaggerUi: './swagger/ui',
  swaggerDefinitionHttpPath: '/swagger',
  swaggerUiHttpPath: '/swagger-ui'

}
```
`swaggerDefinition`: path to your yaml or json definition file, also can be an array of swagger definition

`swaggerUi`: path to your swagger ui files (download them from [swagger-ui](https://github.com/swagger-api/swagger-ui) and put the dist content).

`swaggerDefinitionHttpPath`: path where to access the swagger definition from the web (eg http://localhost:3000/swagger/{filename})

`swaggerUiHttpPath`: path where to access the swagger ui interface from the web (eg http://localhost:3000/swagger/ui)

## Usage
Just create your swagger definition like you do normally, the only difference is that for each `operationId` you should put the name and method 
of the controller that will implement this functionality (`UserController.getProfile` for example).

Another solution if you don't want to have the controller name inside the `operationId` is to add `x-swagger-router-controller` at route or operation level with the name of your controller

If you want to apply some policies to your operation you can use `x-swagger-router-policies` (eg `PermissionPolicy.check,MyPolicy.func`).

The trailpack will create the route and validation of headers/query/params and body for you.

Put `x-swagger-router-policies` on your security definitions to let the trailpack map the security policies for you

## Contributing
We love contributions! Please check out our [Contributor's Guide](https://github.com/trailsjs/trails/blob/master/.github/CONTRIBUTING.md) for more
information on how our projects are organized and how to get started.

## License
[MIT](https://github.com/jaumard/trailpack-design-first/blob/master/LICENSE)

[npm-image]: https://img.shields.io/npm/v/trailpack-design-first.svg?style=flat-square
[npm-url]: https://npmjs.org/package/trailpack-design-first
[ci-image]: https://img.shields.io/travis/jaumard/trailpack-design-first/master.svg?style=flat-square
[ci-url]: https://travis-ci.org/jaumard/trailpack-design-first
[daviddm-image]: http://img.shields.io/david/jaumard/trailpack-design-first.svg?style=flat-square
[daviddm-url]: https://david-dm.org/jaumard/trailpack-design-first
[codeclimate-image]: https://img.shields.io/codeclimate/github/jaumard/trailpack-design-first.svg?style=flat-square
[codeclimate-url]: https://codeclimate.com/github/jaumard/trailpack-design-first
[gitter-image]: http://img.shields.io/badge/+%20GITTER-JOIN%20CHAT%20%E2%86%92-1DCE73.svg?style=flat-square
[gitter-url]: https://gitter.im/trailsjs/trails

