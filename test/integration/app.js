const _ = require('lodash')
const smokesignals = require('smokesignals')
const Controller = require('trails/controller')

module.exports = _.defaultsDeep({
  pkg: {
    name: 'design-first-trailpack-test'
  },
  api: {
    controllers: {
      PetController: class PetController extends Controller {
        findPetsByStatus(req, res) {
          res.status(200).end()
        }

        updatePetWithForm(req, res) {
          res.status(200).end()
        }

        addPet(req, res) {
          res.status(200).end()
        }

        updatePet(req, res) {
          res.status(200).end()
        }
      }
    }
  },
  config: {
    swagger: {
      swaggerDefinition: './test/swagger/info.yaml',
      swaggerUi: './test/swagger-ui/'
    },
    main: {
      packs: [
        require('../../'),
        require('trailpack-router'),
        require('trailpack-express')
      ]
    },
    log: {
      logger: new smokesignals.Logger('verbose')
    },
    web: {
      express: require('express'),
      port: 3000
    },
    routes: []
  }
}, smokesignals.FailsafeConfig)

