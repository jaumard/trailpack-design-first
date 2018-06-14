const _ = require('lodash')
const smokesignals = require('smokesignals')
const Controller = require('trails/controller')
const Policy = require('trails/policy')

module.exports = _.defaultsDeep({
  pkg: {
    name: 'design-first-trailpack-test'
  },
  api: {
    policies: {
      PassportPolicy: class PassportPolicy extends Policy {
        jwt(req, res, next) {
          next()
        }

        bearer(req, res, next) {
          next()
        }
      },
      UserPolicy: class UserPolicy extends Policy {
        check(req, res, next) {
          next()
        }
      }
    },
    controllers: {
      PetController: class PetController extends Controller {
        findPetsByTags(req, res) {
          res.status(200).end()
        }

        getPetById(req, res) {
          res.status(200).end()
        }

        deletePet(req, res) {
          res.status(200).end()
        }

        uploadFile(req, res) {
          res.status(200).end()
        }

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
      },
      UserController: class UserController extends Controller {
        createUser(req, res) {
          res.status(200).end()
        }

        createUsersWithArrayInput(req, res) {
          res.status(200).end()
        }

        createUsersWithListInput(req, res) {
          res.status(200).end()
        }

        loginUser(req, res) {
          res.status(200).end()
        }

        logoutUser(req, res) {
          res.status(200).end()
        }

        getUserByName(req, res) {
          res.status(200).end()
        }

        updateUser(req, res) {
          res.status(200).end()
        }

        deleteUser(req, res) {
          res.status(200).end()
        }
      },
      StoreController: class StoreController extends Controller {

        getInventory(req, res) {
          res.status(200).end()
        }

        placeOrder(req, res) {
          res.status(200).end()
        }

        getOrderById(req, res) {
          res.status(200).end()
        }

        deleteOrder(req, res) {
          res.status(200).end()
        }
      }
    }
  },
  config: {
    swagger: {
      swaggerDefinition: ['./test/swagger/info.yaml'],
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
    policies: {},
    web: {
      express: require('express'),
      port: 3000
    },
    routes: []
  }
}, smokesignals.FailsafeConfig)

